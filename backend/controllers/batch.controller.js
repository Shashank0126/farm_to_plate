const CropBatch   = require('../models/CropBatch.model')
const Purchase    = require('../models/Purchase.model')
const User        = require('../models/User.model')
const blockchain  = require('../blockchain/Blockchain')
const generateId  = require('../utils/generateBatchId')
const { calcOrganicScore } = require('../services/organic.service')
const { recalcTrustScore } = require('../services/trust.service')
const { predictOrganic }   = require('../services/mlClient.service')
const { extractUploadedUrls } = require('../middleware/upload.middleware')
const { emitToUser, emitToAdmins } = require('../sockets/socket.handler')
const { ok, err, created, notFound, serverError } = require('../utils/apiResponse')

// ── CREATE ───────────────────────────────────────────────────────
async function create(req, res) {
  try {
    const {
      farmerName, farmLocation, latitude, longitude,
      soilType, soilQuality, cropName, variety, season,
      harvestDate, areaHectares, fertilizerType, fertilizerName,
      fertilizerQty, irrigationType, notes,
    } = req.body

    const organicScore = calcOrganicScore({ fertilizerType, soilQuality, season, irrigationType, cropName })

    // Optional ML prediction (non-blocking)
    let mlPrediction = null
    try {
      mlPrediction = await predictOrganic({ fertilizerType, soilQuality, season, irrigationType, cropName })
    } catch {}

    const proofImages = extractUploadedUrls(req.files)

    const batch = await CropBatch.create({
      batchId:       generateId(cropName),
      farmer:        req.user._id,
      farmerName,    farmLocation,
      latitude:      latitude  ? parseFloat(latitude)  : undefined,
      longitude:     longitude ? parseFloat(longitude) : undefined,
      soilType,      soilQuality,
      cropName,      variety,      season,
      harvestDate:   new Date(harvestDate),
      areaHectares:  areaHectares ? parseFloat(areaHectares) : undefined,
      fertilizerType, fertilizerName,
      fertilizerQty: fertilizerQty ? parseFloat(fertilizerQty) : undefined,
      irrigationType,
      organicScore,  mlPrediction,
      proofImages,   notes,
      status:        'pending',
    })

    // Update farmer batch count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalBatches: 1 } })

    // Notify admins
    emitToAdmins('notification', { type: 'new_batch', message: `New batch submitted: ${batch.cropName} by ${farmerName}`, time: new Date() })

    return created(res, { batch })
  } catch (e) {
    return serverError(res, e)
  }
}

// ── MY BATCHES ───────────────────────────────────────────────────
async function myBatches(req, res) {
  try {
    const { limit = 20, page = 1, status } = req.query
    const query = { farmer: req.user._id }
    if (status && status !== 'all') query.status = status

    const [batches, total] = await Promise.all([
      CropBatch.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)).lean(),
      CropBatch.countDocuments(query),
    ])
    return ok(res, { batches, total, page: Number(page) })
  } catch (e) {
    return serverError(res, e)
  }
}

// ── GET BY ID ────────────────────────────────────────────────────
async function getById(req, res) {
  try {
    const batch = await CropBatch.findById(req.params.id)
      .populate('farmer', 'name email trustScore reviewCount')
      .lean()
    if (!batch) return notFound(res, 'Batch not found')

    // Farmers can only see their own
    if (req.user.role === 'farmer' && String(batch.farmer._id) !== String(req.user._id)) {
      return notFound(res, 'Batch not found')
    }

    // Add trust info
    const farmerData = batch.farmer || {}
    return ok(res, {
      batch: {
        ...batch,
        farmerTrustScore: farmerData.trustScore,
        reviewCount:      farmerData.reviewCount,
      }
    })
  } catch (e) {
    return serverError(res, e)
  }
}

// ── GET VERIFIED (purchaser browse) ─────────────────────────────
async function getVerified(req, res) {
  try {
    const { sort = 'newest', season, limit = 20, page = 1 } = req.query
    const query = { status: 'verified' }
    if (season) query.season = season

    const sortMap = {
      newest:  { createdAt: -1 },
      organic: { organicScore: -1 },
      trust:   { createdAt: -1 },
    }

    const batches = await CropBatch.find(query)
      .populate('farmer', 'name trustScore reviewCount')
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page-1)*limit)
      .limit(Number(limit))
      .lean()

    return ok(res, { batches })
  } catch (e) {
    return serverError(res, e)
  }
}

// ── GET ALL (admin) ──────────────────────────────────────────────
async function getAll(req, res) {
  try {
    const { status, limit = 30, page = 1, sort = 'newest' } = req.query
    const query = {}
    if (status && status !== 'all') query.status = status

    const [batches, total] = await Promise.all([
      CropBatch.find(query)
        .populate('farmer', 'name trustScore')
        .sort(sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 })
        .skip((page-1)*limit)
        .limit(Number(limit))
        .lean(),
      CropBatch.countDocuments(query),
    ])
    return ok(res, { batches, total })
  } catch (e) {
    return serverError(res, e)
  }
}

// ── ADMIN VERIFY ─────────────────────────────────────────────────
async function verify(req, res) {
  try {
    const batch = await CropBatch.findById(req.params.id)
    if (!batch)                     return notFound(res)
    if (batch.status !== 'pending') return err(res, 'Batch is not pending')

    // Add to blockchain
    const block = await blockchain.addBlock({
      batchId:       batch.batchId,
      cropName:      batch.cropName,
      farmerName:    batch.farmerName,
      farmLocation:  batch.farmLocation,
      organicScore:  batch.organicScore,
      harvestDate:   batch.harvestDate,
      season:        batch.season,
      verifiedAt:    new Date(),
      verifiedBy:    req.user._id,
    }, 'batch')

    batch.status         = 'verified'
    batch.adminNote      = req.body.note || ''
    batch.verifiedAt     = new Date()
    batch.verifiedBy     = req.user._id
    batch.blockchainHash = block.hash
    batch.blockIndex     = block.index
    batch.previousHash   = block.previousHash
    await batch.save()

    // Recalc farmer trust
    await recalcTrustScore(batch.farmer)
    await User.findByIdAndUpdate(batch.farmer, { $inc: { verifiedBatches: 1 } })

    // Notify farmer
    emitToUser(batch.farmer, 'batch:verified', { batchId: batch.batchId, cropName: batch.cropName })

    return ok(res, { batch })
  } catch (e) {
    return serverError(res, e)
  }
}

// ── ADMIN REJECT ─────────────────────────────────────────────────
async function reject(req, res) {
  try {
    const { note } = req.body
    if (!note?.trim()) return err(res, 'Rejection reason required')

    const batch = await CropBatch.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', adminNote: note, verifiedAt: new Date(), verifiedBy: req.user._id },
      { new: true }
    )
    if (!batch) return notFound(res)

    emitToUser(batch.farmer, 'batch:rejected', { batchId: batch.batchId, reason: note })

    return ok(res, { batch })
  } catch (e) {
    return serverError(res, e)
  }
}

// ── DELETE ───────────────────────────────────────────────────────
async function deleteBatch(req, res) {
  try {
    const batch = await CropBatch.findOne({ _id: req.params.id, farmer: req.user._id })
    if (!batch) return notFound(res)
    if (batch.status === 'verified') return err(res, 'Cannot delete a verified batch')
    await batch.deleteOne()
    return ok(res, { message: 'Batch deleted' })
  } catch (e) {
    return serverError(res, e)
  }
}

// ── CONSUMER TRACE ───────────────────────────────────────────────
async function trace(req, res) {
  try {
    const batch = await CropBatch.findOne({ batchId: req.params.id })
      .populate('farmer', 'name email trustScore reviewCount')
      .lean()

    if (!batch) return notFound(res, 'Batch not found')

    const purchases = await Purchase.find({ batch: batch._id })
      .sort({ purchaseDate: 1 })
      .lean()

    return ok(res, { batch, purchases })
  } catch (e) {
    return serverError(res, e)
  }
}

// ── PURCHASE ─────────────────────────────────────────────────────
async function purchase(req, res) {
  try {
    const batch = await CropBatch.findById(req.params.id)
    if (!batch)                    return notFound(res)
    if (batch.status !== 'verified') return err(res, 'Only verified batches can be purchased')

    const {
      purchaserName, purchaseDate, quantityPurchased,
      marketDestination, storageConditions, transportMode, notes,
    } = req.body

    // Append to blockchain
    const block = await blockchain.addBlock({
      type:              'purchase',
      batchId:           batch.batchId,
      cropName:          batch.cropName,
      purchaserName,
      purchaseDate,
      quantityPurchased,
      marketDestination,
    }, 'purchase')

    const pur = await Purchase.create({
      batch:             batch._id,
      purchaser:         req.user._id,
      purchaserName,
      purchaseDate:      new Date(purchaseDate),
      quantityPurchased: parseFloat(quantityPurchased),
      marketDestination,
      storageConditions,
      transportMode,
      notes,
      blockchainHash:    block.hash,
      blockIndex:        block.index,
    })

    await User.findByIdAndUpdate(req.user._id, { $inc: { purchaseCount: 1 } })

    return created(res, { purchase: pur })
  } catch (e) {
    return serverError(res, e)
  }
}

module.exports = { create, myBatches, getById, getVerified, getAll, verify, reject, deleteBatch, trace, purchase }
