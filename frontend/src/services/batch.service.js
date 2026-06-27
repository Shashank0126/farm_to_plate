import api from './api'

const batchService = {
  // Farmer
  create:       (formData) => api.post('/batches',          formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:       (id, data) => api.put(`/batches/${id}`,     data),
  delete:       (id)       => api.delete(`/batches/${id}`),
  myBatches:    ()         => api.get('/batches/my'),
  getById:      (id)       => api.get(`/batches/${id}`),

  // Public / Consumer
  trace:        (id)       => api.get(`/batches/trace/${id}`),

  // Purchaser
  getVerified:  (params)   => api.get('/batches/verified',  { params }),
  purchase:     (id, data) => api.post(`/batches/${id}/purchase`, data),
  myPurchases:  ()         => api.get('/purchases/my'),
  submitFeedback: (id, data) => api.post(`/batches/${id}/feedback`, data),

  // Admin
  getAll:       (params)   => api.get('/batches',           { params }),
  verify:       (id, data) => api.post(`/batches/${id}/verify`, data),
  reject:       (id, data) => api.post(`/batches/${id}/reject`, data),
  getComplaints: ()        => api.get('/complaints'),
  resolveComplaint: (id)   => api.post(`/complaints/${id}/resolve`),
}

export default batchService
