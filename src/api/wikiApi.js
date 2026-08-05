import axios from 'axios'

/**
 * 위키백과에서 장소 사진과 한 줄 설명을 가져온다.
 *
 * 사진을 프로젝트에 넣어 두지 않고 필요할 때만 받아 온다.
 * 문서가 없거나 사진이 없는 곳도 있으므로, 실패는 오류가 아니라
 * "사진 없음"으로 취급하고 화면은 색 타일로 대신한다.
 */
const wiki = axios.create({
  baseURL: 'https://ko.wikipedia.org/api/rest_v1/page/summary',
  timeout: 7000,
})

// 같은 장소를 여러 화면에서 보여 주므로 한 번 받은 건 기억해 둔다
const cache = new Map()

/**
 * @param {string} title 위키백과 문서 제목
 * @returns {Promise<{image:string, extract:string, link:string} | null>}
 */
export const fetchSpotMedia = async (title) => {
  if (!title) return null
  if (cache.has(title)) return cache.get(title)

  try {
    const { data } = await wiki.get(`/${encodeURIComponent(title)}`)

    // 동음이의 문서에는 쓸 만한 사진이 없다
    if (data.type !== 'standard') {
      cache.set(title, null)
      return null
    }

    const media = {
      // 위키미디어는 정해진 크기만 내려준다. 폭을 바꾸면 400이 떨어지므로 준 주소를 그대로 쓴다
      image: data.thumbnail?.source ?? '',
      extract: data.extract ?? '',
      link: data.content_urls?.desktop?.page ?? '',
    }

    cache.set(title, media.image ? media : null)
    return cache.get(title)
  } catch {
    // 네트워크 실패도 "사진 없음"으로 처리한다
    cache.set(title, null)
    return null
  }
}
