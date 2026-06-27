const mongoose = require('mongoose')

const blockRecordSchema = new mongoose.Schema({
  index:        { type: Number, required: true, unique: true },
  timestamp:    { type: Date,   required: true },
  data:         { type: mongoose.Schema.Types.Mixed },
  previousHash: { type: String, required: true },
  hash:         { type: String, required: true, unique: true },
  nonce:        { type: Number, default: 0 },
  transactions: { type: Number, default: 1 },
  type:         { type: String, enum: ['genesis', 'batch', 'purchase', 'verification'], default: 'batch' },
}, {
  timestamps: false,
})

module.exports = mongoose.model('BlockRecord', blockRecordSchema)
