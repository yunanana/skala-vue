// Mock API가 시작될 때 사용할 상품 원본 데이터입니다.
const initialProducts = [
  {
    id: 1,
    name: 'Vue 3 실전 가이드',
    category: '도서',
    price: 32000,
    stock: 8,
    description: '비 올 때 챙기면 좋은 접이식 우산',
  },
  {
    id: 2,
    name: '무선 키보드',
    category: '장비',
    price: 49000,
    stock: 5,
    description: '프런트엔드 개발자를 위한 저소음 무선 키보드',
  },
  {
    id: 3,
    name: '버티컬 마우스',
    category: '장비',
    price: 39000,
    stock: 0,
    description: '손목 부담을 줄이는 인체공학 마우스',
  },
  {
    id: 4,
    name: 'USB-C 허브',
    category: '장비',
    price: 59000,
    stock: 4,
    description: 'HDMI와 USB 포트를 지원하는 7-in-1 허브',
  },
  {
    id: 5,
    name: '웹 접근성 체크리스트',
    category: '도서',
    price: 18000,
    stock: 12,
    description: '실무 UI 접근성 점검 항목을 정리한 핸드북',
  },
]

// 데이터베이스 대신 서버 메모리에서 사용하는 상태입니다.
let products = []
let nextProductId = 1

export function resetProducts() {
  // 원본 데이터가 수정되지 않도록 깊은 복사합니다.
  products = structuredClone(initialProducts)
  nextProductId = Math.max(...products.map((product) => product.id)) + 1
  return products
}

/**
 * 저장해 둔 목록으로 현재 상태를 통째로 되돌린다.
 * (브라우저 Mock 어댑터가 localStorage에 남겨 둔 데이터를 복원할 때 쓴다)
 * 배열 자체를 새로 만들지 않고 내용만 갈아 끼워, 다음 id도 이어서 매기도록 한다.
 */
export function hydrateProducts(savedProducts) {
  if (!Array.isArray(savedProducts)) return products

  products = structuredClone(savedProducts)
  nextProductId = products.length ? Math.max(...products.map((product) => product.id)) + 1 : 1
  return products
}

export function listProducts() {
  return products
}

export function getProductCount() {
  return products.length
}

export function findProductById(productId) {
  return products.find((product) => product.id === productId)
}

export function createProduct(productInput) {
  const product = {
    id: nextProductId++,
    ...productInput,
  }
  products.push(product)
  return product
}

export function updateProduct(productId, patch) {
  const product = findProductById(productId)
  if (!product) return undefined

  Object.assign(product, patch)
  return product
}

export function deleteProduct(productId) {
  const index = products.findIndex((product) => product.id === productId)
  if (index === -1) return undefined

  const [deletedProduct] = products.splice(index, 1)
  return deletedProduct
}

// 모듈을 처음 불러올 때 초기 데이터를 준비합니다.
resetProducts()

