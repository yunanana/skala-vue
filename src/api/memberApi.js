import { http } from './http.js'

// 회원 목록 조회·삭제. 두 요청 모두 서버에서 로그인 상태를 확인한다.
// (토큰은 http.js의 요청 인터셉터가 자동으로 붙여 준다)
export const memberApi = {
  async getAll(params = {}) {
    const response = await http.get('/members', { params })
    return response.data
  },

  async remove(memberId) {
    const response = await http.delete(`/members/${memberId}`)
    return response.data
  },
}
