const axios = require('axios')

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

async function predictOrganic(features) {
  try {
    const { data } = await axios.post(`${ML_URL}/predict/organic`, features, { timeout: 5000 })
    return data.organic_probability ?? null
  } catch {
    // ML service is optional — fall back to rule-based score
    return null
  }
}

async function predictFraud(features) {
  try {
    const { data } = await axios.post(`${ML_URL}/predict/fraud`, features, { timeout: 5000 })
    return data.fraud_risk ?? null
  } catch {
    return null
  }
}

module.exports = { predictOrganic, predictFraud }
