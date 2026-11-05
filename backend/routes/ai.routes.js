const express = require('express')
const router  = express.Router()
const rateLimit = require('express-rate-limit')
const { optionalAuth } = require('../middleware/auth.middleware')
const { handleChat, getSuggestions } = require('../controllers/ai.controller')

// Dedicated AI rate limiter (30 requests per minute per IP)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'AI request limit reached. Please wait a moment.' }
})

router.use(aiLimiter)
router.use(optionalAuth)

router.post('/chat', handleChat)
router.get('/suggestions', getSuggestions)

module.exports = router
