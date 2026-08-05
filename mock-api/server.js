import http from 'node:http'

import { getProductCount, resetProducts } from './data/productStore.js'
import { getPostCount, resetPosts } from './data/postStore.js'
import { getMemberCount, resetMembers } from './data/memberStore.js'
import { getPlaceCount, resetPlaces } from './data/placeStore.js'
import { handleProductRoutes } from './routes/productRoutes.js'
import { handlePostRoutes } from './routes/postRoutes.js'
import { handleAuthRoutes } from './routes/authRoutes.js'
import { handleMemberRoutes } from './routes/memberRoutes.js'
import { handlePlaceRoutes } from './routes/placeRoutes.js'
import { sendError, sendJson, waitForRequestedDelay } from './utils/httpUtils.js'

// Vue 개발 서버(3100)와 겹치지 않는 API 전용 포트입니다.
const port = Number(process.env.API_PORT ?? 3001)

const server = http.createServer(async (request, response) => {
  // 브라우저가 교차 출처 요청 전에 보내는 CORS 사전 요청입니다.
  if (request.method === 'OPTIONS') {
    sendJson(response, 204)
    return
  }

  // request.url은 경로만 전달되므로 host를 조합하여 URL 객체로 만듭니다.
  const host = request.headers.host ?? `localhost:${port}`
  const url = new URL(request.url ?? '/', `http://${host}`)

  try {
    // ?delay=1500처럼 전달하면 최대 3초까지 응답을 늦출 수 있습니다.
    // 로딩 표시와 타임아웃 처리를 확인할 때 쓴다.
    await waitForRequestedDelay(url)

    // API 서버의 실행 상태를 확인하는 엔드포인트입니다.
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, {
        status: 'ok',
        productCount: getProductCount(),
        postCount: getPostCount(),
        memberCount: getMemberCount(),
        placeCount: getPlaceCount(),
      })
      return
    }

    // 상품·게시글·회원 데이터를 처음 상태로 되돌립니다.
    if (request.method === 'POST' && url.pathname === '/api/reset') {
      const products = resetProducts()
      const posts = resetPosts()
      const members = resetMembers()
      const places = resetPlaces()

      sendJson(response, 200, {
        message: '모든 데이터를 처음 상태로 되돌렸습니다.',
        productCount: products.length,
        postCount: posts.length,
        memberCount: members.length,
        placeCount: places.length,
      })
      return
    }

    // 각 라우터는 자신이 요청을 처리했으면 true를 반환합니다.
    if (await handleAuthRoutes(request, response, url)) return
    if (await handleMemberRoutes(request, response, url)) return
    if (await handlePlaceRoutes(request, response, url)) return
    if (await handleProductRoutes(request, response, url)) return
    if (await handlePostRoutes(request, response, url)) return

    sendJson(response, 404, {
      message: '존재하지 않는 API 경로입니다.',
    })
  } catch (error) {
    // JSON 오류나 유효성 검사 오류는 상태 코드와 함께 공통 처리합니다.
    sendError(response, error)
  }
})

server.listen(port, () => {
  process.stdout.write(`API 서버 실행: http://localhost:${port}/api\n`)
})
