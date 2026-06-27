/**
 * Client-side organic score estimator.
 * Mirrors the server-side algorithm for instant UI feedback.
 */

export function calcOrganicScore({ fertilizerType, soilQuality, season, irrigationType, cropName }) {
  let score = 0

  // Fertilizer contribution (0–40)
  const fert = (fertilizerType || '').toLowerCase()
  if      (fert === 'organic')   score += 40
  else if (fert === 'mixed')     score += 20
  else if (fert === 'inorganic') score += 0

  // Soil quality (0–30)
  const soil = (soilQuality || '').toLowerCase()
  if      (soil === 'excellent') score += 30
  else if (soil === 'good')      score += 22
  else if (soil === 'average')   score += 12
  else if (soil === 'poor')      score += 4

  // Seasonal suitability (0–20)
  const seasonMap = {
    kharif: ['rice','maize','sorghum','bajra','cotton','groundnut','soybean','sugarcane'],
    rabi:   ['wheat','barley','mustard','peas','gram','linseed','potato'],
    zaid:   ['cucumber','muskmelon','watermelon','fodder'],
  }
  const s = (season || '').toLowerCase()
  const c = (cropName || '').toLowerCase()
  if (s && c && seasonMap[s]?.some(v => c.includes(v))) score += 20
  else score += 10   // partial credit for off-season

  // Irrigation type (0–10)
  const irr = (irrigationType || '').toLowerCase()
  if      (irr === 'drip')       score += 10
  else if (irr === 'sprinkler')  score += 8
  else if (irr === 'canal')      score += 5
  else if (irr === 'rainfed')    score += 10
  else if (irr === 'borewell')   score += 3

  return Math.min(Math.round(score), 100)
}

export function organicLabel(score) {
  if (score >= 70) return { label: 'High Organic', color: 'green',  className: 'organic-high'   }
  if (score >= 40) return { label: 'Moderate',     color: 'yellow', className: 'organic-medium' }
  return               { label: 'Low Organic',  color: 'red',    className: 'organic-low'    }
}

export function trustColor(score) {
  if (score >= 4.5) return 'text-brand-400'
  if (score >= 3.5) return 'text-yellow-400'
  return 'text-red-400'
}
