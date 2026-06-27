'use strict'

const SEASONAL_CROPS = {
  kharif: ['rice','maize','sorghum','bajra','cotton','groundnut','soybean','sugarcane','jute','arhar'],
  rabi:   ['wheat','barley','mustard','peas','gram','linseed','potato','onion'],
  zaid:   ['cucumber','muskmelon','watermelon','fodder','moong','urad'],
}

/**
 * Calculate organic score (0–100) from batch field inputs.
 */
function calcOrganicScore({ fertilizerType, soilQuality, season, irrigationType, cropName }) {
  let score = 0

  // 1. Fertilizer (0–40)
  const fert = (fertilizerType || '').toLowerCase()
  if      (fert === 'organic')   score += 40
  else if (fert === 'mixed')     score += 20
  else if (fert === 'inorganic') score += 0

  // 2. Soil quality (0–30)
  const soil = (soilQuality || '').toLowerCase()
  const soilMap = { excellent: 30, good: 22, average: 12, poor: 4 }
  score += soilMap[soil] ?? 0

  // 3. Seasonal suitability (0–20)
  const s = (season || '').toLowerCase()
  const c = (cropName || '').toLowerCase()
  const suited = s && c && (SEASONAL_CROPS[s] || []).some(v => c.includes(v))
  score += suited ? 20 : 10

  // 4. Irrigation (0–10)
  const irr = (irrigationType || '').toLowerCase()
  const irrMap = { drip: 10, rainfed: 10, sprinkler: 8, canal: 5, tank: 5, borewell: 3 }
  score += irrMap[irr] ?? 2

  return Math.min(Math.round(score), 100)
}

module.exports = { calcOrganicScore }
