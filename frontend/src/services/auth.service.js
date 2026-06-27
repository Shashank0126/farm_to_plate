import api from './api'

const authService = {
  login:    (email, password) => api.post('/auth/login',    { email, password }),
  register: (payload)         => api.post('/auth/register', payload),
  me:       ()                => api.get('/auth/me'),
  refresh:  ()                => api.post('/auth/refresh'),
}

export default authService
