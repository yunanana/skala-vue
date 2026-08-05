// 회원(로그인 계정) 데이터입니다.
// 로그인·회원가입·회원 목록이 모두 이 저장소 하나를 바라봅니다.
// 실제 서버라면 DB에 저장하고 비밀번호는 해시로 보관해야 합니다.
const initialMembers = [
  {
    id: 1,
    email: 'user@weather.app',
    password: '1234',
    name: '홍길동',
    role: 'MEMBER',
    department: '일반',
    joinedAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 2,
    email: 'admin@weather.app',
    password: 'admin1234',
    name: '관리자',
    role: 'ADMIN',
    department: '운영',
    joinedAt: '2026-08-01T09:00:00.000Z',
  },
]

let members = []
let nextMemberId = 1

export function resetMembers() {
  members = structuredClone(initialMembers)
  nextMemberId = Math.max(...members.map((member) => member.id)) + 1
  return members
}

/**
 * 저장해 둔 목록으로 되돌린다 (브라우저에 남겨 둔 값 복원용)
 *
 * 예전에 저장된 목록에 기본 계정이 빠져 있을 수 있으므로,
 * 없는 기본 계정은 다시 채워 넣는다. (안내된 계정으로 항상 로그인되도록)
 */
export function hydrateMembers(savedMembers) {
  if (!Array.isArray(savedMembers) || savedMembers.length === 0) return members

  members = structuredClone(savedMembers)

  initialMembers.forEach((seed) => {
    if (members.some((member) => member.email === seed.email)) return
    members.push(structuredClone(seed))
  })

  nextMemberId = Math.max(...members.map((member) => member.id)) + 1
  return members
}

export function listMembers() {
  return members
}

export function getMemberCount() {
  return members.length
}

export function findMemberById(memberId) {
  return members.find((member) => member.id === memberId)
}

export function findMemberByEmail(email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase()
  return members.find((member) => member.email === normalized)
}

/** 이메일/비밀번호가 맞는 회원을 찾는다 (로그인용) */
export function findMemberByCredentials(email, password) {
  const member = findMemberByEmail(email)
  return member && member.password === password ? member : undefined
}

export function createMember(memberInput) {
  const member = {
    id: nextMemberId++,
    ...memberInput,
    email: memberInput.email.trim().toLowerCase(),
    joinedAt: new Date().toISOString(),
  }
  members.push(member)
  return member
}

export function deleteMember(memberId) {
  const index = members.findIndex((member) => member.id === memberId)
  if (index === -1) return undefined

  const [deletedMember] = members.splice(index, 1)
  return deletedMember
}

/** 비밀번호를 뺀 공개용 회원 정보 */
export function toPublicMember({ password: _password, ...publicMember }) {
  return publicMember
}

/**
 * 회원가입 입력값 검사 — Node 라우터와 브라우저 Mock이 같은 규칙을 쓴다.
 * 반환값이 빈 배열이면 통과.
 */
export function validateSignup(input) {
  const errors = []

  if (typeof input.name !== 'string' || input.name.trim().length < 2) {
    errors.push('이름은 2글자 이상이어야 합니다.')
  }

  if (!/^\S+@\S+\.\S+$/.test(String(input.email ?? '').trim())) {
    errors.push('올바른 이메일 형식이 아닙니다.')
  }

  if (typeof input.password !== 'string' || input.password.length < 4) {
    errors.push('비밀번호는 4자 이상이어야 합니다.')
  }

  return errors
}

// 모듈을 처음 불러올 때 초기 데이터를 준비합니다.
resetMembers()
