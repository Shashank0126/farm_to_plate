import api from './api'

/**
 * Send messages and context to Groq AI backend
 * @param {Array} messages - [{ role: 'user'|'assistant', content: string }]
 * @param {Object} context - { role: string, batchId?: string, page?: string }
 */
export async function sendChatMessage(messages, context = {}) {
  const response = await api.post('/ai/chat', {
    messages,
    context
  })
  return response.data
}

/**
 * Fetch context-aware prompt suggestions
 * @param {string} role - 'farmer' | 'purchaser' | 'consumer' | 'admin'
 * @param {string} [batchId] - optional batch identifier
 */
export async function getAiSuggestions(role, batchId) {
  const response = await api.get('/ai/suggestions', {
    params: { role, batchId }
  })
  return response.data
}

export default {
  sendChatMessage,
  getAiSuggestions
}
