const blockchain = require('../blockchain/Blockchain')
const { ok, serverError } = require('../utils/apiResponse')

async function getChain(req, res) {
  try {
    const chain = await blockchain.getChain()
    return ok(res, { chain })
  } catch (e) {
    return serverError(res, e)
  }
}

async function validate(req, res) {
  try {
    const valid = await blockchain.isValid()
    return ok(res, { valid })
  } catch (e) {
    return serverError(res, e)
  }
}

async function getStats(req, res) {
  try {
    const stats = await blockchain.getStats()
    return ok(res, stats)
  } catch (e) {
    return serverError(res, e)
  }
}

async function getLogs(req, res) {
  try {
    const chain = await blockchain.getChain()
    const logs  = chain.slice(1).map(b => ({
      index:     b.index,
      hash:      b.hash,
      type:      b.type,
      timestamp: b.timestamp,
      summary:   b.data?.cropName || b.data?.purchaserName || b.data?.message || '—',
    }))
    return ok(res, { logs: logs.reverse() })
  } catch (e) {
    return serverError(res, e)
  }
}

module.exports = { getChain, validate, getStats, getLogs }
