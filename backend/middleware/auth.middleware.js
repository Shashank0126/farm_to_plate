const jwt  = require('jsonwebtoken')
const User = require('../models/User.model')

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token   = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('-password')
    if (!user)           return res.status(401).json({ message: 'User not found' })
    if (user.suspended)  return res.status(403).json({ message: 'Account suspended' })

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' })
    return res.status(401).json({ message: 'Invalid token' })
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: `Access denied for role: ${req.user?.role}` })
    }
    next()
  }
}

// Optional auth (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      const token   = header.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user    = await User.findById(decoded.id).select('-password')
      if (user && !user.suspended) req.user = user
    }
  } catch {}
  next()
}

module.exports = { protect, authorize, optionalAuth }
