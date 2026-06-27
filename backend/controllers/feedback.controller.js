const Feedback   = require('../models/Feedback.model')
const CropBatch  = require('../models/CropBatch.model')
const Purchase   = require('../models/Purchase.model')
const { recalcTrustScore } = require('../services/trust.service')
const { emitToAdmins, emitToUser } = require('../sockets/socket.handler')
const { ok, err, created, notFound, serverError } = require('../utils/apiResponse')

async function submit(req, res) {
  try {
    const batch = await CropBatch.findById(req.params.id)
    if (!batch) return notFound(res, 'Batch not found')

    const { type, description, rating, purchaseId } = req.body
    if (!type || !rating) return err(res, 'type and rating are required')

    // Check if already submitted for this purchase
    if (purchaseId) {
      const pur = await Purchase.findById(purchaseId)
      if (pur?.feedbackSubmitted) return err(res, 'Feedback already submitted for this purchase')
      if (pur) {
        pur.feedbackSubmitted = true
        await pur.save()
      }
    }

    const feedback = await Feedback.create({
      batch:        batch._id,
      purchaser:    req.user._id,
      farmer:       batch.farmer,
      purchase:     purchaseId,
      type,         description,
      rating:       parseInt(rating),
      purchaserName: req.user.name,
    })

    // Recalc farmer trust
    await recalcTrustScore(batch.farmer)

    // Flag batch if too many complaints
    const complaintCount = await Feedback.countDocuments({ batch: batch._id })
    if (complaintCount >= 3) {
      await CropBatch.findByIdAndUpdate(batch._id, { flagged: true })
    }

    // Notify farmer + admins
    emitToUser(batch.farmer, 'complaint:received', { batchId: batch.batchId, type })
    emitToAdmins('complaint:new', { batchId: batch.batchId, farmerName: batch.farmerName, type })

    return created(res, { feedback })
  } catch (e) {
    return serverError(res, e)
  }
}

async function getComplaints(req, res) {
  try {
    const complaints = await Feedback.find()
      .populate('batch',     'batchId cropName farmerName farmer')
      .populate('purchaser', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    // Attach farmer trust
    const populated = await Promise.all(complaints.map(async (c) => {
      if (c.batch?.farmer) {
        const { default: User } = await import('../models/User.model.js').catch(() => ({ default: require('../models/User.model') }))
        const farmer = await require('../models/User.model').findById(c.batch.farmer).select('name trustScore').lean()
        return { ...c, batch: { ...c.batch, farmer } }
      }
      return c
    }))

    return ok(res, { complaints: populated })
  } catch (e) {
    return serverError(res, e)
  }
}

async function resolve(req, res) {
  try {
    const fb = await Feedback.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date(), resolvedBy: req.user._id },
      { new: true }
    )
    if (!fb) return notFound(res)

    // Recalc trust after resolution
    await recalcTrustScore(fb.farmer)

    return ok(res, { feedback: fb })
  } catch (e) {
    return serverError(res, e)
  }
}

module.exports = { submit, getComplaints, resolve }
