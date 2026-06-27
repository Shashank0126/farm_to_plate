const Purchase  = require('../models/Purchase.model')
const { ok, serverError } = require('../utils/apiResponse')

async function myPurchases(req, res) {
  try {
    const { limit = 20, page = 1 } = req.query
    const purchases = await Purchase.find({ purchaser: req.user._id })
      .populate('batch', 'cropName batchId organicScore farmer harvestDate blockchainHash')
      .sort({ createdAt: -1 })
      .skip((page-1) * limit)
      .limit(Number(limit))
      .lean()
    return ok(res, { purchases })
  } catch (e) {
    return serverError(res, e)
  }
}

async function purchaserStats(req, res) {
  try {
    const purchases = await Purchase.find({ purchaser: req.user._id })
      .populate('batch', 'organicScore')
      .lean()

    const total   = purchases.length
    const scores  = purchases.map(p => p.batch?.organicScore).filter(Boolean)
    const avgOrg  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    const now       = new Date()
    const thisMonth = purchases.filter(p => {
      const d = new Date(p.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length

    const pendingFeedback = purchases.filter(p => !p.feedbackSubmitted).length

    return ok(res, { total, avgOrganic: avgOrg, thisMonth, pendingFeedback })
  } catch (e) {
    return serverError(res, e)
  }
}

module.exports = { myPurchases, purchaserStats }
