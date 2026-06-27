const router = require('express').Router()
const { myPurchases, purchaserStats } = require('../controllers/purchase.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

router.get('/my',    protect, authorize('purchaser'), myPurchases)
router.get('/stats', protect, authorize('purchaser'), purchaserStats)

module.exports = router
