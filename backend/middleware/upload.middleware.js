const { upload } = require('../config/cloudinary')

// Multi-field upload for crop batch
const batchUpload = upload.fields([
  { name: 'cropImages',     maxCount: 5 },
  { name: 'fertilizerBill', maxCount: 3 },
  { name: 'soilReport',     maxCount: 3 },
  { name: 'farmPhotos',     maxCount: 5 },
])

// Flatten all uploaded files to a single array of URLs
function extractUploadedUrls(files) {
  const urls = []
  if (!files) return urls
  Object.values(files).forEach(group => {
    group.forEach(file => urls.push(file.path))
  })
  return urls
}

module.exports = { batchUpload, extractUploadedUrls }
