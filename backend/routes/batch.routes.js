const router  = require('express').Router()
const ctrl    = require('../controllers/batch.controller')
const fbCtrl  = require('../controllers/feedback.controller')
const { protect, authorize, optionalAuth } = require('../middleware/auth.middleware')
const { batchUpload } = require('../middleware/upload.middleware')

// Public — consumer trace
router.get('/trace/:id',           optionalAuth, ctrl.trace)

// Verified batches — purchasers browse
router.get('/verified',            protect, authorize('purchaser', 'admin'), ctrl.getVerified)

// Farmer's own batches
router.get('/my',                  protect, authorize('farmer'), ctrl.myBatches)

// Admin — all batches
router.get('/',                    protect, authorize('admin'), ctrl.getAll)

// Create batch (farmer + file upload)
router.post('/',                   protect, authorize('farmer'), batchUpload, ctrl.create)

// Get single batch
router.get('/:id',                 protect, ctrl.getById)

// Update batch (farmer, pending only)
router.put('/:id',                 protect, authorize('farmer'), ctrl.update || ((req,res) => res.json({ message: 'update coming' })))

// Delete batch (farmer, pending only)
router.delete('/:id',              protect, authorize('farmer'), ctrl.deleteBatch)

// Admin verify / reject
router.post('/:id/verify',         protect, authorize('admin'), ctrl.verify)
router.post('/:id/reject',         protect, authorize('admin'), ctrl.reject)

// Purchaser — purchase a batch
router.post('/:id/purchase',       protect, authorize('purchaser'), ctrl.purchase)

// Purchaser — submit feedback
router.post('/:id/feedback',       protect, authorize('purchaser'), fbCtrl.submit)

module.exports = router
