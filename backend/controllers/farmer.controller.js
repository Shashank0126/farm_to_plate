const CropBatch = require('../models/CropBatch.model')
const Feedback  = require('../models/Feedback.model')
const User      = require('../models/User.model')
const { ok, serverError } = require('../utils/apiResponse')

async function farmerStats(req, res) {
  try {
    const farmerId = req.user._id

    const [total, verified, pending, rejected, complaints, farmer] = await Promise.all([
      CropBatch.countDocuments({ farmer: farmerId }),
      CropBatch.countDocuments({ farmer: farmerId, status: 'verified' }),
      CropBatch.countDocuments({ farmer: farmerId, status: 'pending' }),
      CropBatch.countDocuments({ farmer: farmerId, status: 'rejected' }),
      Feedback.countDocuments({ farmer: farmerId, resolved: false }),
      User.findById(farmerId).select('trustScore reviewCount').lean(),
    ])

    // Average organic score of verified batches
    const scored = await CropBatch.aggregate([
      { $match: { farmer: farmerId, status: 'verified' } },
      { $group: { _id: null, avg: { $avg: '$organicScore' } } },
    ])
    const avgOrganic = scored[0] ? Math.round(scored[0].avg) : 0

    return ok(res, {
      total, verified, pending, rejected,
      complaints, avgOrganic,
      trustScore: farmer?.trustScore ?? 5,
      reviews:    farmer?.reviewCount ?? 0,
    })
  } catch (e) {
    return serverError(res, e)
  }
}

module.exports = { farmerStats }
