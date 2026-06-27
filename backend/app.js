const express     = require('express')
const cors        = require('cors')
const helmet      = require('helmet')
const morgan      = require('morgan')
const rateLimit   = require('express-rate-limit')
const path        = require('path')

const app = express()

// ── Security middleware ──────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))

// ── Rate limiting ────────────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { message: 'Too many auth requests. Try again in 15 minutes.' },
}))
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max:      200,
}))

// ── Body parser ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Logger ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth.routes'))
app.use('/api/batches',     require('./routes/batch.routes'))
app.use('/api/purchases',   require('./routes/purchase.routes'))
app.use('/api/complaints',  require('./routes/complaint.routes'))
app.use('/api/blockchain',  require('./routes/blockchain.routes'))
app.use('/api/admin',       require('./routes/admin.routes'))
app.use('/api/farmers',     require('./routes/farmer.routes'))
app.use('/api/purchasers',  require('./routes/purchaser.routes'))

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }))

// ── 404 ──────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route ${req.path} not found` }))

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err)
  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Internal server error'
  res.status(status).json({ message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) })
})

module.exports = app
