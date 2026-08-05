import {
  createPlace,
  deletePlace,
  findPlaceById,
  listPlaces,
  updatePlace,
  validatePlace,
} from '../data/placeStore.js'
import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

const editableFields = ['name', 'city', 'category', 'kind', 'rainOk', 'heatEscape', 'windy', 'note']

/** 요청 본문에서 저장할 값만 골라 낸다 */
function pickFields(body) {
  const picked = {}

  editableFields.forEach((field) => {
    if (!Object.hasOwn(body, field)) return
    picked[field] = typeof body[field] === 'string' ? body[field].trim() : body[field]
  })

  return picked
}

/**
 * 사용자가 추가한 장소 라우터 (조회 · 등록 · 수정 · 삭제)
 */
export async function handlePlaceRoutes(request, response, url) {
  // 1. 목록: 검색어(q)가 있으면 이름과 설명에서 찾는다
  if (request.method === 'GET' && url.pathname === '/api/places') {
    const keyword = (url.searchParams.get('q') ?? '').trim().toLowerCase()

    const places = listPlaces().filter(
      (place) =>
        !keyword ||
        place.name.toLowerCase().includes(keyword) ||
        (place.note ?? '').toLowerCase().includes(keyword),
    )

    sendJson(response, 200, places)
    return true
  }

  // 2. 등록
  if (request.method === 'POST' && url.pathname === '/api/places') {
    const body = await readJsonBody(request)
    const errors = validatePlace(body)
    if (errors.length) throw createHttpError(400, errors.join(' '))

    sendJson(response, 201, createPlace({ note: '', ...pickFields(body) }))
    return true
  }

  const match = url.pathname.match(/^\/api\/places\/(\d+)$/)
  if (!match) return false

  const placeId = Number(match[1])

  // 3. 수정
  if (request.method === 'PATCH') {
    if (!findPlaceById(placeId)) throw createHttpError(404, '수정할 장소를 찾을 수 없습니다.')

    const body = await readJsonBody(request)
    const errors = validatePlace(body, true)
    if (errors.length) throw createHttpError(400, errors.join(' '))

    sendJson(response, 200, updatePlace(placeId, pickFields(body)))
    return true
  }

  // 4. 삭제
  if (request.method === 'DELETE') {
    const deleted = deletePlace(placeId)
    if (!deleted) throw createHttpError(404, '삭제할 장소를 찾을 수 없습니다.')

    sendJson(response, 200, deleted)
    return true
  }

  return false
}
