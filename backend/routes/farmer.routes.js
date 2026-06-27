const router = require('express').Router()
const { farmerStats } = require('../controllers/farmer.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

router.get('/stats', protect, authorize('farmer'), farmerStats)

module.exports = router
