import {
  deleteMember,
  findMemberById,
  listMembers,
  toPublicMember,
} from '../data/memberStore.js'
import { createHttpError, sendJson } from '../utils/httpUtils.js'
import { authenticateRequest } from './authRoutes.js'

/**
 * 회원 목록 라우터
 *
 * 가입한 계정을 확인·삭제하는 화면에서 사용합니다.
 * 개인정보를 다루므로 두 요청 모두 로그인(Bearer Token)이 필요합니다.
 */
export async function handleMemberRoutes(request, response, url) {
  // 1. 목록 조회: 검색어(q)가 있으면 이름·이메일·권한에서 찾습니다.
  if (request.method === 'GET' && url.pathname === '/api/members') {
    authenticateRequest(request)

    const keyword = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const members = listMembers()
      .filter(
        (member) =>
          !keyword ||
          [member.name, member.email, member.role].some((value) =>
            value.toLowerCase().includes(keyword),
          ),
      )
      .map(toPublicMember)

    sendJson(response, 200, members)
    return true
  }

  // 2. 회원 삭제: /api/members/3 처럼 뒤에 id가 붙습니다.
  const deleteMatch = url.pathname.match(/^\/api\/members\/(\d+)$/)
  if (request.method === 'DELETE' && deleteMatch) {
    const currentUser = authenticateRequest(request)
    const memberId = Number(deleteMatch[1])

    if (!findMemberById(memberId)) {
      throw createHttpError(404, '삭제할 회원을 찾을 수 없습니다.')
    }

    // 로그인한 본인 계정은 지울 수 없게 막습니다. (지우면 토큰이 붕 뜬다)
    if (currentUser.id === memberId) {
      throw createHttpError(400, '현재 로그인한 계정은 삭제할 수 없습니다.')
    }

    sendJson(response, 200, toPublicMember(deleteMember(memberId)))
    return true
  }

  return false
}
