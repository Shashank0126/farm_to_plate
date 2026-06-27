const router = require('express').Router()
const { getStats, getUsers, suspendUser, adjustTrust } = require('../controllers/admin.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

const guard = [protect, authorize('admin')]

router.get('/stats',                    ...guard, getStats)
router.get('/users',                    ...guard, getUsers)
router.put('/users/:id/suspend',        ...guard, suspendUser)
router.put('/users/:id/trust',          ...guard, adjustTrust)

module.exports = router
