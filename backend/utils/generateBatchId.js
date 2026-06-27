/**
 * Generates a unique human-readable batch ID.
 * Format: BATCH-YYYYMMDD-XXXXX
 */
function generateBatchId(cropName = '') {
  const date   = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`
  const prefix  = cropName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || 'CRP'
  const random  = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}-${dateStr}-${random}`
}

module.exports = generateBatchId
