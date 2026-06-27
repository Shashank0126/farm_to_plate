const mongoose = require('mongoose')

const purchaseSchema = new mongoose.Schema({
  batch:              { type: mongoose.Schema.Types.ObjectId, ref: 'CropBatch', required: true },
  purchaser:          { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },

  purchaserName:      { type: String, required: true },
  purchaseDate:       { type: Date,   required: true },
  quantityPurchased:  { type: Number, required: true },
  marketDestination:  { type: String, required: true },
  storageConditions:  { type: String },
  transportMode:      { type: String },
  notes:              { type: String },

  // Blockchain
  blockchainHash:     { type: String },
  blockIndex:         { type: Number },

  // Feedback
  feedbackSubmitted:  { type: Boolean, default: false },
}, {
  timestamps: true,
})

purchaseSchema.index({ purchaser: 1, createdAt: -1 })
purchaseSchema.index({ batch: 1 })

module.exports = mongoose.model('Purchase', purchaseSchema)
