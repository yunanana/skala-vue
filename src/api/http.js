import axios from 'axios'

import { mockAdapter } from './mockAdapter.js'

// 토큰을 sessionStorage에 보관할 때 쓰는 키 (auth 스토어와 공유한다)
const accessTokenKey = 'jwt-lab-access-token'

// 정적 호스팅(GitHub Pages 등)에는 Node 서버가 없다.
// 이때는 브라우저 안에서 도는 Mock 어댑터로 API를 대신 처리한다.
const useBrowserMock = import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL

// .env의 VITE_API_BASE_URL이 있으면 그 값을 쓴다.
// 없을 때는 배포 환경이면 같은 도메인의 /api(서버리스 함수),
// 개발 환경이면 따로 띄운 Mock API 서버(localhost:3001)를 가리킨다.
const baseURL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api')

export const http = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client': 'between-weather',
  },
  // 어댑터만 갈아 끼우므로 각 API 모듈 코드는 그대로 쓴다
  ...(useBrowserMock ? { adapter: mockAdapter } : {}),
})

/**
 * 요청 인터셉터 — 저장된 토큰이 있으면 Authorization 헤더를 자동으로 붙인다.
 * 각 API 함수가 토큰을 직접 챙기지 않아도 된다.
 */
http.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem(accessTokenKey)

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

/**
 * 응답 인터셉터 — 모든 API 오류를 화면에서 쓰기 쉬운 Error로 통일한다.
 * status를 함께 실어야 401일 때 자동 로그아웃 처리를 할 수 있다.
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'API 응답 시간이 초과되었습니다.'
        : '지금은 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.')

    const normalizedError = new Error(message)
    normalizedError.status = error.response?.status

    return Promise.reject(normalizedError)
  },
)

export { accessTokenKey }
