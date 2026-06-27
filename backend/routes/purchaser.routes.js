const router = require('express').Router()
const { purchaserStats } = require('../controllers/purchase.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

router.get('/stats', protect, authorize('purchaser'), purchaserStats)

module.exports = router
