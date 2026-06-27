import api from './api'

const blockchainService = {
  getChain:     ()    => api.get('/blockchain/chain'),
  getBlock:     (hash)=> api.get(`/blockchain/block/${hash}`),
  getLogs:      ()    => api.get('/blockchain/logs'),
  validate:     ()    => api.get('/blockchain/validate'),
  getStats:     ()    => api.get('/blockchain/stats'),
}

export default blockchainService
