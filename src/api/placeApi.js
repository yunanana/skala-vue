import { http } from './http.js'

// 사용자가 직접 추가한 장소 (조회·등록·수정·삭제)
export const placeApi = {
  async getAll(params = {}) {
    const response = await http.get('/places', { params })
    return response.data
  },

  async create(place) {
    const response = await http.post('/places', place)
    return response.data
  },

  async update(placeId, patch) {
    const response = await http.patch(`/places/${placeId}`, patch)
    return response.data
  },

  async remove(placeId) {
    const response = await http.delete(`/places/${placeId}`)
    return response.data
  },
}
