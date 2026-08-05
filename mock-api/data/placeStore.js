// 사용자가 직접 추가한 장소입니다.
// 기본 제공 명소(src/data/spots.js)와 같은 항목을 가지므로,
// 추천 점수를 매기는 계산에 그대로 섞여 들어갑니다.
// 처음에는 비어 있다. 사용자가 추가한 것만 이 목록에 쌓인다.
const initialPlaces = []

let places = []
let nextPlaceId = 1

export function resetPlaces() {
  places = structuredClone(initialPlaces)
  nextPlaceId = places.length ? Math.max(...places.map((place) => place.id)) + 1 : 1
  return places
}

/** 저장해 둔 목록으로 되돌린다 (브라우저 Mock의 localStorage 복원용) */
export function hydratePlaces(savedPlaces) {
  if (!Array.isArray(savedPlaces)) return places

  places = structuredClone(savedPlaces)
  nextPlaceId = places.length ? Math.max(...places.map((place) => place.id)) + 1 : 1
  return places
}

export function listPlaces() {
  return places
}

export function getPlaceCount() {
  return places.length
}

export function findPlaceById(placeId) {
  return places.find((place) => place.id === placeId)
}

export function createPlace(input) {
  const place = { id: nextPlaceId++, ...input }
  places.push(place)
  return place
}

export function updatePlace(placeId, patch) {
  const place = findPlaceById(placeId)
  if (!place) return undefined

  Object.assign(place, patch)
  return place
}

export function deletePlace(placeId) {
  const index = places.findIndex((place) => place.id === placeId)
  if (index === -1) return undefined

  const [deleted] = places.splice(index, 1)
  return deleted
}

const CATEGORY_KEYS = ['culture', 'water', 'walk', 'view', 'market', 'nature']
const KIND_KEYS = ['indoor', 'outdoor']

/**
 * 장소 입력값 검사 — Node 라우터와 브라우저 Mock이 같은 규칙을 쓴다.
 * 반환값이 빈 배열이면 통과.
 */
export function validatePlace(input, partial = false) {
  const errors = []

  if (!partial || Object.hasOwn(input, 'name')) {
    if (typeof input.name !== 'string' || input.name.trim().length < 2) {
      errors.push('장소 이름은 2글자 이상이어야 합니다.')
    }
  }

  if (!partial || Object.hasOwn(input, 'city')) {
    if (typeof input.city !== 'string' || !input.city.trim()) {
      errors.push('지역을 선택해주세요.')
    }
  }

  if (!partial || Object.hasOwn(input, 'category')) {
    if (!CATEGORY_KEYS.includes(input.category)) {
      errors.push('갈래가 올바르지 않습니다.')
    }
  }

  if (!partial || Object.hasOwn(input, 'kind')) {
    if (!KIND_KEYS.includes(input.kind)) {
      errors.push('실내·실외 값이 올바르지 않습니다.')
    }
  }

  return errors
}

resetPlaces()
