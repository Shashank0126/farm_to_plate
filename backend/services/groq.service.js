const axios = require('axios')

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Verify current IDs periodically at GET https://api.groq.com/openai/v1/models
const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']

async function getGroqOrganicAssessment(batchData) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn('Groq Warning: GROQ_API_KEY is missing in process.env')
    return null
  }

  const area = Number(batchData.areaHectares || 0)
  const qty = Number(batchData.fertilizerQty || 0)
  const dosagePerHa = area > 0 && qty > 0 ? (qty / area).toFixed(1) : null

  const prompt = `
    You are an agricultural organic verification expert.
    Evaluate whether this crop batch is organic based on farm area, fertilizer quantity used, fertilizer type, and agricultural practices.

    Batch Farm Data:
    - cropName: ${batchData.cropName || 'unknown'}
    - areaHectares: ${area > 0 ? `${area} hectares` : 'not provided'}
    - fertilizerType: ${batchData.fertilizerType || 'unknown'} (Organic / Inorganic / Mixed)
    - fertilizerName: ${batchData.fertilizerName || 'unknown'}
    - fertilizerQty: ${qty > 0 ? `${qty} kg` : 'not provided'}
    - fertilizerDosage: ${dosagePerHa ? `${dosagePerHa} kg per hectare` : 'dosage unknown'}
    - soilQuality: ${batchData.soilQuality || 'unknown'}
    - season: ${batchData.season || 'unknown'}
    - irrigationType: ${batchData.irrigationType || 'unknown'}
    - notes: ${batchData.notes || 'No notes provided'}

    Verification Rules:
    1. If fertilizerType is Inorganic or Mixed with heavy chemical usage per hectare, organic probability should be LOW (0.0 to 0.4).
    2. If fertilizerType is Organic (e.g. Compost, Vermicompost, Neem Cake, Bio-fertilizer), analyze if the quantity (${qty} kg for ${area} hectares, i.e., ${dosagePerHa || 'N/A'} kg/ha) is appropriate and realistic for organic crop production.
    3. Heavy excessive synthetic fertilizer usage per hectare signals chemical contamination risk.
    4. Mention the area (${area || 'N/A'} ha), fertilizer quantity (${qty || 'N/A'} kg), dosage (${dosagePerHa || 'N/A'} kg/ha), and fertilizer type explicitly in your reasoning.

    Return STRICT JSON with this structure only:
    {
      "organic_probability": 0.0 to 1.0 (number),
      "confidence": "low|medium|high",
      "reasoning": "Clear explanation referencing area, fertilizer quantity used per hectare, and organic authenticity."
    }
  `

  for (const model of MODELS) {
    try {
      const response = await axios.post(GROQ_API_URL, {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a precise agricultural verification assistant. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 400
      }, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      const content = response?.data?.choices?.[0]?.message?.content
      if (!content) continue

      // Strip <think>...</think> tags if present
      let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```json/gi, '').replace(/```/g, '').trim()

      // Extract JSON substring if there's surrounding text
      const firstBrace = cleaned.indexOf('{')
      const lastBrace = cleaned.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1)
      }

      const parsed = JSON.parse(cleaned)

      const probability = Number(parsed.organic_probability)

      return {
        organic_probability: Number.isFinite(probability) ? Math.min(Math.max(probability, 0), 1) : 0.5,
        confidence: String(parsed.confidence || 'medium').toLowerCase(),
        reasoning: String(parsed.reasoning || 'Groq AI verification complete.')
      }
    } catch (error) {
      console.error(`Groq assessment error [${model}]:`, error.response?.data?.error?.message || error.message)
    }
  }

  return null
}

module.exports = { getGroqOrganicAssessment }