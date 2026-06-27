const { Server } = require('socket.io')
const jwt        = require('jsonwebtoken')
const User       = require('../models/User.model')

let io

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('No token'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user    = await User.findById(decoded.id).select('-password')
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch {
      next(new Error('Auth failed'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.user
    // Join role-based room
    socket.join(user.role)
    socket.join(`user:${user._id}`)

    socket.on('disconnect', () => {})
  })

  return io
}

function getIO() { return io }

// Emit to specific user
function emitToUser(userId, event, data) {
  io?.to(`user:${userId}`).emit(event, data)
}

// Emit to all admins
function emitToAdmins(event, data) {
  io?.to('admin').emit(event, data)
}

// Emit to all farmers
function emitToFarmers(event, data) {
  io?.to('farmer').emit(event, data)
}

module.exports = { initSocket, getIO, emitToUser, emitToAdmins, emitToFarmers }
