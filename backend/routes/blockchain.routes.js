const router = require('express').Router()
const { getChain, validate, getStats, getLogs } = require('../controllers/blockchain.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

router.get('/chain',    protect, authorize('admin'), getChain)
router.get('/validate', protect, authorize('admin'), validate)
router.get('/stats',    protect, authorize('admin'), getStats)
router.get('/logs',     protect, authorize('admin'), getLogs)

module.exports = router
