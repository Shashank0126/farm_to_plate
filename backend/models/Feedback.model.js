const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
  batch:       { type: mongoose.Schema.Types.ObjectId, ref: 'CropBatch', required: true },
  purchaser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  farmer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  purchase:    { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },

  type:        {
    type: String,
    enum: ['quality_mismatch', 'organic_inaccurate', 'damaged_produce', 'fake_info', 'other'],
    required: true,
  },
  description: { type: String },
  rating:      { type: Number, min: 1, max: 5, required: true },

  resolved:    { type: Boolean, default: false },
  resolvedAt:  { type: Date },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  purchaserName: { type: String },
}, {
  timestamps: true,
})

feedbackSchema.index({ farmer: 1, resolved: 1 })
feedbackSchema.index({ batch: 1 })

module.exports = mongoose.model('Feedback', feedbackSchema)
