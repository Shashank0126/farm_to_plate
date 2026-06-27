const User       = require('../models/User.model')
const CropBatch  = require('../models/CropBatch.model')
const Purchase   = require('../models/Purchase.model')
const Feedback   = require('../models/Feedback.model')
const blockchain = require('../blockchain/Blockchain')
const { ok, err, notFound, serverError } = require('../utils/apiResponse')

async function getStats(req, res) {
  try {
    const [
      totalBatches, verified, pending, rejected,
      totalUsers, openComplaints,
      highOrg, midOrg, lowOrg,
      topFarmers, chainStats,
    ] = await Promise.all([
      CropBatch.countDocuments(),
      CropBatch.countDocuments({ status: 'verified' }),
      CropBatch.countDocuments({ status: 'pending' }),
      CropBatch.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: { $in: ['farmer','purchaser'] } }),
      Feedback.countDocuments({ resolved: false }),
      CropBatch.countDocuments({ status: 'verified', organicScore: { $gte: 70 } }),
      CropBatch.countDocuments({ status: 'verified', organicScore: { $gte: 40, $lt: 70 } }),
      CropBatch.countDocuments({ status: 'verified', organicScore: { $lt: 40 } }),
      User.find({ role: 'farmer' }).sort({ trustScore: -1 }).limit(5).select('name trustScore verifiedBatches').lean(),
      blockchain.getStats(),
    ])

    // Monthly data (last 6 months)
    const monthly = []
    for (let i = 5; i >= 0; i--) {
      const d     = new Date()
      d.setMonth(d.getMonth() - i)
      const year  = d.getFullYear()
      const month = d.getMonth()
      const start = new Date(year, month, 1)
      const end   = new Date(year, month + 1, 0)
      const [tot, ver] = await Promise.all([
        CropBatch.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        CropBatch.countDocuments({ status: 'verified', verifiedAt: { $gte: start, $lte: end } }),
      ])
      monthly.push({
        month: d.toLocaleString('default', { month: 'short' }),
        total: tot,
        verified: ver,
      })
    }

    // Regional data
    const regionalRaw = await CropBatch.aggregate([
      { $match: { farmLocation: { $exists: true, $ne: '' } } },
      { $group: { _id: '$farmLocation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ])
    const regionalData = regionalRaw.map(r => ({ region: r._id.slice(0, 15), count: r.count }))

    return ok(res, {
      totalBatches, verified, pending, rejected,
      totalUsers, openComplaints,
      highOrganic: highOrg, midOrganic: midOrg, lowOrganic: lowOrg,
      topFarmers, monthlyBatches: monthly, regionalData,
      chainLength:   chainStats.chainLength,
      transactions:  chainStats.transactions,
      lastBlockTime: chainStats.lastBlockTime
        ? new Date(chainStats.lastBlockTime).toLocaleTimeString()
        : '—',
      verifiedTrend: verified > 0 ? Math.round((verified / totalBatches) * 100) : 0,
    })
  } catch (e) {
    return serverError(res, e)
  }
}

async function getUsers(req, res) {
  try {
    const { role = 'farmer', page = 1, limit = 20 } = req.query
    const users = await User.find({ role })
      .sort({ createdAt: -1 })
      .skip((page-1)*limit)
      .limit(Number(limit))
      .lean()
    return ok(res, { users })
  } catch (e) {
    return serverError(res, e)
  }
}

async function suspendUser(req, res) {
  try {
    const { suspended } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { suspended }, { new: true })
    if (!user) return notFound(res)
    return ok(res, { user: user.toPublic() })
  } catch (e) {
    return serverError(res, e)
  }
}

async function adjustTrust(req, res) {
  try {
    const { delta } = req.body
    const user = await User.findById(req.params.id)
    if (!user) return notFound(res)
    user.trustScore = Math.min(5, Math.max(0, parseFloat((user.trustScore + delta).toFixed(1))))
    await user.save()
    return ok(res, { trustScore: user.trustScore })
  } catch (e) {
    return serverError(res, e)
  }
}

module.exports = { getStats, getUsers, suspendUser, adjustTrust }
