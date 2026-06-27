const User     = require('../models/User.model')
const Feedback = require('../models/Feedback.model')
const CropBatch = require('../models/CropBatch.model')

async function recalcTrustScore(farmerId) {
  try {
    const [complaints, verified] = await Promise.all([
      Feedback.countDocuments({ farmer: farmerId, resolved: false }),
      CropBatch.countDocuments({ farmer: farmerId, status: 'verified' }),
    ])

    const farmer = await User.findById(farmerId)
    if (!farmer) return

    const base    = 5
    const penalty = Math.min(complaints * 0.25, 3)   // max −3 from complaints
    const bonus   = Math.min(verified   * 0.1,  1)   // max +1 from verified batches
    const score   = Math.max(0, parseFloat((base - penalty + bonus).toFixed(1)))

    farmer.trustScore      = score
    farmer.verifiedBatches = verified
    await farmer.save()

    return score
  } catch (err) {
    console.error('Trust recalc error:', err.message)
  }
}

module.exports = { recalcTrustScore }
