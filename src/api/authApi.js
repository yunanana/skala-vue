import { http } from './http.js'

// Store가 Axios의 URL과 HTTP 메서드를 직접 관리하지 않도록 API 계층을 분리합니다.
export const authApi = {
  async login(credentials) {
    const response = await http.post('/auth/login', credentials)
    return response.data
  },

  async signup(newMember) {
    const response = await http.post('/auth/signup', newMember)
    return response.data
  },

  async getMyProfile() {
    const response = await http.get('/auth/me')
    return response.data
  },

  async getProtectedMessage() {
    const response = await http.get('/auth/protected-message')
    return response.data
  },
}

