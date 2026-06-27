const mongoose = require('mongoose')

const cropBatchSchema = new mongoose.Schema({
  // Identity
  batchId:       { type: String, unique: true },
  farmer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Farm info
  farmerName:    { type: String, required: true },
  farmLocation:  { type: String },
  latitude:      { type: Number },
  longitude:     { type: Number },
  soilType:      { type: String },
  soilQuality:   { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor'] },

  // Crop info
  cropName:      { type: String, required: true },
  variety:       { type: String },
  season:        { type: String, enum: ['Kharif', 'Rabi', 'Zaid', 'Annual'] },
  harvestDate:   { type: Date,   required: true },
  areaHectares:  { type: Number },

  // Fertilizer
  fertilizerType:{ type: String, enum: ['Organic', 'Inorganic', 'Mixed'] },
  fertilizerName:{ type: String },
  fertilizerQty: { type: Number },

  // Irrigation
  irrigationType:{ type: String },

  // Proof documents (Cloudinary URLs)
  proofImages:   [{ type: String }],

  // Scoring
  organicScore:  { type: Number, default: 0 },   // 0–100
  mlPrediction:  { type: Number },               // from FastAPI

  // Status & verification
  status:        { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  adminNote:     { type: String },
  verifiedAt:    { type: Date },
  verifiedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Blockchain
  blockchainHash:{ type: String },
  blockIndex:    { type: Number },
  previousHash:  { type: String },

  // Misc
  notes:         { type: String },
  flagged:       { type: Boolean, default: false },
}, {
  timestamps: true,
})

// Indexes
cropBatchSchema.index({ farmer: 1, status: 1 })
cropBatchSchema.index({ status: 1, createdAt: -1 })
cropBatchSchema.index({ batchId: 1 })
cropBatchSchema.index({ cropName: 'text', farmerName: 'text', farmLocation: 'text' })

module.exports = mongoose.model('CropBatch', cropBatchSchema)
