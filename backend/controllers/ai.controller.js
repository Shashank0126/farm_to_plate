const { chatWithGroq, generateSuggestions, fetchBatchContext } = require('../services/groqChat.service')

/**
 * POST /api/ai/chat
 * Handle chat queries with Groq AI
 */
async function handleChat(req, res, next) {
  try {
    const { messages, context } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'messages array is required and cannot be empty.'
      })
    }

    let user = req.user
    if (!user && (context?.userId || context?.userEmail)) {
      const User = require('../models/User.model')
      if (context.userId) {
        user = await User.findById(context.userId).select('-password')
      } else if (context.userEmail) {
        user = await User.findOne({ email: context.userEmail }).select('-password')
      }
    }

    const result = await chatWithGroq({
      messages,
      context: context || {},
      user: user || null
    })

    res.json({
      success: true,
      ...result
    })
  } catch (err) {
    console.error('Error in AI handleChat:', err.message)
    res.status(500).json({
      success: false,
      message: err.message || 'AI assistant is currently unavailable.'
    })
  }
}

/**
 * GET /api/ai/suggestions
 * Fetch dynamic prompts based on role and batch
 */
async function getSuggestions(req, res, next) {
  try {
    const role = req.query.role || req.user?.role || 'consumer'
    const batchId = req.query.batchId
    const batchData = await fetchBatchContext(batchId)

    const suggestions = generateSuggestions(role, !!batchData)
    res.json({
      success: true,
      suggestions,
      batchInfo: batchData ? { batchId: batchData.batchId, cropName: batchData.cropName } : null
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  handleChat,
  getSuggestions
}
