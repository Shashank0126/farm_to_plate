const router = require('express').Router()
const { getComplaints, resolve } = require('../controllers/feedback.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

router.get('/',              protect, authorize('admin'), getComplaints)
router.post('/:id/resolve',  protect, authorize('admin'), resolve)

module.exports = router
