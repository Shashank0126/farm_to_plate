const jwt  = require('jsonwebtoken')
const User = require('../models/User.model')
const { ok, err, created, serverError } = require('../utils/apiResponse')

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
}

async function register(req, res) {
  try {
    const { name, email, password, role, phone } = req.body

    if (!['farmer','purchaser'].includes(role)) {
      return err(res, 'Invalid role. Must be farmer or purchaser.')
    }

    const exists = await User.findOne({ email })
    if (exists) return err(res, 'Email already registered')

    const user  = await User.create({ name, email, password, role, phone })
    const token = signToken(user._id)

    return created(res, { token, user: user.toPublic() })
  } catch (e) {
    return serverError(res, e)
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) return err(res, 'Email and password required')

    const user = await User.findOne({ email }).select('+password')
    if (!user) return err(res, 'Invalid credentials', 401)

    const match = await user.comparePassword(password)
    if (!match) return err(res, 'Invalid credentials', 401)

    if (user.suspended) return err(res, 'Account suspended. Contact admin.', 403)

    const token = signToken(user._id)
    return ok(res, { token, user: user.toPublic() })
  } catch (e) {
    return serverError(res, e)
  }
}

async function me(req, res) {
  return ok(res, { user: req.user })
}

module.exports = { register, login, me }
