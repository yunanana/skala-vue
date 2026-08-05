/**
 * 브라우저 안에서 도는 Mock API 어댑터
 *
 * GitHub Pages 같은 정적 호스팅에는 Node 서버를 띄울 수 없다.
 * 하지만 이 프로젝트의 API는 메모리 배열을 다루는 Mock이라, 굳이 서버가 없어도
 * 같은 데이터와 같은 규칙을 브라우저에서 그대로 재현할 수 있다.
 *
 * axios의 adapter를 갈아 끼우는 방식이라 productApi/postApi/authApi 코드는
 * 한 줄도 바뀌지 않는다. (전송 계층만 교체)
 *
 * 데이터는 localStorage에 함께 저장하므로 새로고침해도 그대로 남는다.
 * 처음 상태로 되돌리려면 상품 화면의 [데이터 초기화] 버튼(POST /reset)을 쓴다.
 */
import {
  createProduct,
  deleteProduct,
  findProductById,
  hydrateProducts,
  listProducts,
  resetProducts,
  updateProduct,
} from '../../mock-api/data/productStore.js'
import {
  createPost,
  deletePost,
  findPostById,
  hydratePosts,
  listPosts,
  resetPosts,
  updatePost,
} from '../../mock-api/data/postStore.js'
import {
  createMember,
  deleteMember,
  findMemberByCredentials,
  findMemberByEmail,
  findMemberById,
  hydrateMembers,
  listMembers,
  resetMembers,
  toPublicMember,
  validateSignup,
} from '../../mock-api/data/memberStore.js'
import {
  createPlace,
  deletePlace,
  findPlaceById,
  hydratePlaces,
  listPlaces,
  resetPlaces,
  updatePlace,
  validatePlace,
} from '../../mock-api/data/placeStore.js'

// localStorage에 저장할 때 쓰는 키
const productStorageKey = 'between-weather-products'
const postStorageKey = 'between-weather-posts'
const memberStorageKey = 'between-weather-members'
const placeStorageKey = 'between-weather-places'

const readStorage = (key) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  } catch {
    // 저장된 값이 깨졌으면 초기 데이터로 시작한다
    return null
  }
}

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 사생활 보호 모드 등으로 저장이 막혀도 화면 동작은 계속되어야 한다
  }
}

/** 현재 메모리 상태를 localStorage에 남긴다 (CRUD 후 호출) */
const persist = () => {
  writeStorage(productStorageKey, listProducts())
  writeStorage(postStorageKey, listPosts())
  writeStorage(memberStorageKey, listMembers())
  writeStorage(placeStorageKey, listPlaces())
}

/** 저장해 둔 데이터가 있으면 불러와 메모리 상태를 복원한다 (모듈 최초 로드 시 1회) */
const restore = () => {
  hydrateProducts(readStorage(productStorageKey))
  hydratePosts(readStorage(postStorageKey))
  hydrateMembers(readStorage(memberStorageKey))
  hydratePlaces(readStorage(placeStorageKey))
}

restore()

/** 상태 코드를 가진 오류 (axios 오류 형태로 변환하기 위해 사용) */
const httpError = (status, message) => ({ status, data: { message } })

const base64url = (value) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')

/**
 * 서명 없는 데모용 토큰.
 * 서버가 없으므로 검증할 주체도 없다. 구조만 JWT와 같게 맞춰
 * 화면에서 payload를 디코딩해 보여줄 수 있게 한다.
 */
const createMockToken = (user) => {
  const issuedAt = Math.floor(Date.now() / 1000)
  const header = { alg: 'none', typ: 'JWT' }
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + 15 * 60,
    iss: 'browser-mock',
  }
  return `${base64url(header)}.${base64url(payload)}.browser-mock-signature`
}

const currentUserFromToken = (headers) => {
  const authorization = headers?.Authorization ?? headers?.authorization ?? ''
  const [type, token] = String(authorization).split(' ')
  if (type !== 'Bearer' || !token) throw httpError(401, 'Bearer Access Token이 필요합니다.')

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')))
    if (payload.exp * 1000 < Date.now()) throw httpError(401, 'Access Token이 만료되었습니다.')

    const user = findMemberById(Number(payload.sub))
    if (!user) throw httpError(401, '토큰의 사용자를 찾을 수 없습니다.')
    return toPublicMember(user)
  } catch (error) {
    if (error.status) throw error
    throw httpError(401, '올바른 토큰이 아닙니다.')
  }
}

/** 상품 유효성 검사 (서버 라우터와 동일한 규칙) */
const validateProduct = (input, partial = false) => {
  const errors = []
  if (!partial || Object.hasOwn(input, 'name')) {
    if (typeof input.name !== 'string' || !input.name.trim()) errors.push('상품명은 필수입니다.')
  }
  if (!partial || Object.hasOwn(input, 'price')) {
    if (!Number.isFinite(Number(input.price)) || Number(input.price) < 0) errors.push('가격은 0 이상의 숫자여야 합니다.')
  }
  if (!partial || Object.hasOwn(input, 'stock')) {
    if (!Number.isInteger(Number(input.stock)) || Number(input.stock) < 0) errors.push('재고는 0 이상의 정수여야 합니다.')
  }
  return errors
}

const routes = {
  'GET /health': () => ({
    status: 'ok',
    productCount: listProducts().length,
    postCount: listPosts().length,
    memberCount: listMembers().length,
    placeCount: listPlaces().length,
  }),

  // 상품·게시글·회원을 처음 상태로 되돌린다 (mock-api/server.js의 /api/reset과 같은 응답)
  'POST /reset': () => {
    const products = resetProducts()
    const posts = resetPosts()
    const members = resetMembers()
    const places = resetPlaces()

    return {
      message: '모든 데이터를 처음 상태로 되돌렸습니다.',
      productCount: products.length,
      postCount: posts.length,
      memberCount: members.length,
      placeCount: places.length,
    }
  },

  'GET /products': (_body, params) => {
    const query = (params.get('q') ?? '').trim().toLowerCase()
    const category = params.get('category') ?? '전체'
    const onlyAvailable = params.get('available') === 'true'

    return listProducts().filter((product) => {
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      const matchesCategory = category === '전체' || product.category === category
      const matchesAvailability = !onlyAvailable || product.stock > 0
      return matchesQuery && matchesCategory && matchesAvailability
    })
  },

  'POST /products': (body) => {
    const errors = validateProduct(body)
    if (errors.length) throw httpError(400, errors.join(' '))

    return createProduct({
      name: body.name.trim(),
      category: body.category || '기타',
      price: Number(body.price),
      stock: Number(body.stock),
      description: body.description || '',
    })
  },

  'GET /posts': (_body, params) => {
    const query = (params.get('q') ?? '').trim().toLowerCase()
    return listPosts()
      .filter(
        (post) =>
          !query ||
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.author.toLowerCase().includes(query),
      )
      .toSorted((a, b) => b.id - a.id)
  },

  'POST /posts': (body) => {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw httpError(400, '게시글 제목은 필수입니다.')
    }
    return createPost({
      title: body.title.trim(),
      content: (body.content ?? '').trim(),
      author: (body.author ?? '').trim() || '익명',
    })
  },

  'POST /auth/login': (body) => {
    const user = findMemberByCredentials(body.email, body.password)
    if (!user) throw httpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')

    return {
      message: '로그인에 성공했습니다.',
      tokenType: 'Bearer',
      accessToken: createMockToken(user),
      expiresIn: 900,
      user: toPublicMember(user),
    }
  },

  // 회원가입 — 서버 라우터(authRoutes.js)와 같은 검사·같은 응답 형태
  'POST /auth/signup': (body) => {
    const errors = validateSignup(body)
    if (errors.length) throw httpError(400, errors.join(' '))
    if (findMemberByEmail(body.email)) throw httpError(409, '이미 가입된 이메일입니다.')

    const member = createMember({
      name: body.name.trim(),
      email: body.email,
      password: body.password,
      role: 'STUDENT',
      department: (body.department ?? '').trim() || '미지정',
    })

    return {
      message: '회원가입이 완료되었습니다.',
      tokenType: 'Bearer',
      accessToken: createMockToken(member),
      expiresIn: 900,
      user: toPublicMember(member),
    }
  },

  'GET /places': (_body, params) => {
    const keyword = (params.get('q') ?? '').trim().toLowerCase()
    return listPlaces().filter(
      (place) =>
        !keyword ||
        place.name.toLowerCase().includes(keyword) ||
        (place.note ?? '').toLowerCase().includes(keyword),
    )
  },

  'POST /places': (body) => {
    const errors = validatePlace(body)
    if (errors.length) throw httpError(400, errors.join(' '))

    return createPlace({
      ...body,
      name: body.name.trim(),
      note: (body.note ?? '').trim(),
    })
  },

  'GET /auth/me': (_body, _params, headers) => currentUserFromToken(headers),

  // 회원 목록 — 로그인한 사용자만 볼 수 있다
  'GET /members': (_body, params, headers) => {
    currentUserFromToken(headers)

    const keyword = (params.get('q') ?? '').trim().toLowerCase()
    return listMembers()
      .filter(
        (member) =>
          !keyword ||
          [member.name, member.email, member.role].some((value) =>
            value.toLowerCase().includes(keyword),
          ),
      )
      .map(toPublicMember)
  },

  'GET /auth/protected-message': (_body, _params, headers) => {
    const user = currentUserFromToken(headers)
    return {
      message: `${user.name}님, JWT 인증이 필요한 API 호출에 성공했습니다.`,
      role: user.role,
      requestedAt: new Date().toISOString(),
    }
  },
}

/** /products/3 처럼 id가 붙는 경로를 처리한다 */
const handleWithId = (method, resource, id, body, headers) => {
  const numericId = Number(id)

  if (resource === 'products') {
    if (method === 'GET') {
      const found = findProductById(numericId)
      if (!found) throw httpError(404, '상품을 찾을 수 없습니다.')
      return found
    }
    if (method === 'PATCH') {
      if (!findProductById(numericId)) throw httpError(404, '수정할 상품을 찾을 수 없습니다.')
      const errors = validateProduct(body, true)
      if (errors.length) throw httpError(400, errors.join(' '))

      const patch = {}
      for (const field of ['name', 'category', 'price', 'stock', 'description']) {
        if (Object.hasOwn(body, field)) {
          patch[field] = ['price', 'stock'].includes(field) ? Number(body[field]) : body[field]
        }
      }
      return updateProduct(numericId, patch)
    }
    if (method === 'DELETE') {
      const removed = deleteProduct(numericId)
      if (!removed) throw httpError(404, '삭제할 상품을 찾을 수 없습니다.')
      return removed
    }
  }

  if (resource === 'posts') {
    if (method === 'GET') {
      const found = findPostById(numericId)
      if (!found) throw httpError(404, '게시글을 찾을 수 없습니다.')
      return found
    }
    if (method === 'PATCH') {
      if (!findPostById(numericId)) throw httpError(404, '수정할 게시글을 찾을 수 없습니다.')
      if (Object.hasOwn(body, 'title') && !String(body.title).trim()) {
        throw httpError(400, '게시글 제목은 필수입니다.')
      }
      const patch = {}
      for (const field of ['title', 'content', 'author']) {
        if (Object.hasOwn(body, field)) patch[field] = String(body[field]).trim()
      }
      return updatePost(numericId, patch)
    }
    if (method === 'DELETE') {
      const removed = deletePost(numericId)
      if (!removed) throw httpError(404, '삭제할 게시글을 찾을 수 없습니다.')
      return removed
    }
  }

  if (resource === 'places') {
    if (method === 'PATCH') {
      if (!findPlaceById(numericId)) throw httpError(404, '수정할 장소를 찾을 수 없습니다.')

      const errors = validatePlace(body, true)
      if (errors.length) throw httpError(400, errors.join(' '))

      const patch = {}
      for (const field of ['name', 'city', 'category', 'kind', 'rainOk', 'heatEscape', 'windy', 'note']) {
        if (Object.hasOwn(body, field)) {
          patch[field] = typeof body[field] === 'string' ? body[field].trim() : body[field]
        }
      }
      return updatePlace(numericId, patch)
    }

    if (method === 'DELETE') {
      const removed = deletePlace(numericId)
      if (!removed) throw httpError(404, '삭제할 장소를 찾을 수 없습니다.')
      return removed
    }
  }

  if (resource === 'members' && method === 'DELETE') {
    // 개인정보를 지우는 요청이므로 로그인 상태를 먼저 확인한다
    const currentUser = currentUserFromToken(headers)

    if (!findMemberById(numericId)) throw httpError(404, '삭제할 회원을 찾을 수 없습니다.')
    if (currentUser.id === numericId) {
      throw httpError(400, '현재 로그인한 계정은 삭제할 수 없습니다.')
    }

    return toPublicMember(deleteMember(numericId))
  }

  throw httpError(404, '존재하지 않는 API 경로입니다.')
}

/**
 * axios adapter 규격에 맞춘 함수.
 * 성공하면 응답 객체를 resolve, 실패하면 axios 오류 모양으로 reject 한다.
 */
export const mockAdapter = async (config) => {
  const method = (config.method ?? 'get').toUpperCase()

  // baseURL('/api')을 떼고 순수 경로만 남긴다
  const path = String(config.url ?? '').replace(/^\/api/, '') || '/'
  const pathname = path.split('?')[0].replace(/\/$/, '') || '/'
  const [, resource, id] = pathname.split('/')

  const params = new URLSearchParams(
    Object.entries(config.params ?? {}).filter(([, value]) => value !== undefined && value !== null),
  )

  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data ?? {})

  // 로딩 UI를 확인할 수 있도록 아주 짧은 지연을 준다
  await new Promise((resolve) => setTimeout(resolve, 120))

  try {
    let data

    // 1) 경로 전체가 등록된 라우트인지 먼저 본다.
    //    (/auth/login처럼 두 칸짜리 경로를 'login'이라는 id로 오해하지 않도록)
    const handler = routes[`${method} ${pathname}`]

    if (handler) {
      data = handler(body, params, config.headers)
    } else if (id) {
      // 2) /products/3 처럼 뒤에 id가 붙은 경로
      data = handleWithId(method, resource, id, body, config.headers)
    } else {
      throw httpError(404, '존재하지 않는 API 경로입니다.')
    }

    // 데이터를 바꾸는 요청이었다면 결과를 localStorage에 남긴다 (새로고침 대비)
    if (method !== 'GET') persist()

    // 새 자원을 만든 요청만 201, 나머지(로그인·초기화 등)는 200
    const isCreated = method === 'POST' && !id && ['products', 'posts', 'places'].includes(resource)

    return { data, status: isCreated ? 201 : 200, statusText: 'OK', headers: {}, config }
  } catch (error) {
    const status = error.status ?? 500
    return Promise.reject({
      isAxiosError: true,
      config,
      response: { status, data: error.data ?? { message: '알 수 없는 오류입니다.' }, headers: {}, config },
    })
  }
}
