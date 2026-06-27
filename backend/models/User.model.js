const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 8, select: false },
  phone:      { type: String, trim: true },
  role:       { type: String, enum: ['farmer', 'purchaser', 'admin'], default: 'farmer' },

  // Farmer-specific
  trustScore:      { type: Number, default: 5.0, min: 0, max: 5 },
  reviewCount:     { type: Number, default: 0 },
  totalBatches:    { type: Number, default: 0 },
  verifiedBatches: { type: Number, default: 0 },

  // Purchaser-specific
  purchaseCount:   { type: Number, default: 0 },

  // Admin flags
  suspended: { type: Boolean, default: false },
  verified:  { type: Boolean, default: false },

  // Profile
  avatar:    { type: String },
  bio:       { type: String },
}, {
  timestamps: true,
})

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password
userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password)
}

// Public profile (no password)
userSchema.methods.toPublic = function() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

// Recalculate trust score
userSchema.methods.recalcTrust = async function() {
  const Feedback = require('./Feedback.model')
  const complaints = await Feedback.countDocuments({ farmer: this._id })
  const base = 5
  const penalty = Math.min(complaints * 0.2, 3) // max −3
  const bonus   = Math.min(this.verifiedBatches * 0.1, 1)
  this.trustScore = Math.max(0, parseFloat((base - penalty + bonus).toFixed(1)))
  await this.save()
}

module.exports = mongoose.model('User', userSchema)
