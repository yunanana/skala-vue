import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { authApi } from '@/api/authApi.js'
import { accessTokenKey } from '@/api/http.js'

const userStorageKey = 'jwt-lab-user'

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(userStorageKey))
  } catch {
    return null
  }
}

function decodeJwtPayload(token) {
  if (!token) return null

  try {
    const encodedPayload = token.split('.')[1]
    const base64 = encodedPayload.replaceAll('-', '+').replaceAll('_', '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(padded), (character) =>
      character.charCodeAt(0),
    )

    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  // 새로고침해도 같은 브라우저 탭에서는 로그인 상태를 유지합니다.
  const accessToken = ref(sessionStorage.getItem(accessTokenKey))
  const user = ref(readStoredUser())

  const isLoading = ref(false)
  const errorMessage = ref('')
  const protectedMessage = ref(null)

  // state에서 계산되는 Pinia getter 역할의 computed 값입니다.
  const isLoggedIn = computed(() => Boolean(accessToken.value && user.value))
  const statusMessage = computed(() =>
    isLoggedIn.value
      ? `${user.value.name}님이 로그인했습니다.`
      : '로그인이 필요합니다.',
  )
  const authorizationHeader = computed(() =>
    accessToken.value ? `Bearer ${accessToken.value}` : '',
  )
  const tokenPayload = computed(() => decodeJwtPayload(accessToken.value))

  function saveAuthentication(loginResponse) {
    accessToken.value = loginResponse.accessToken
    user.value = loginResponse.user

    sessionStorage.setItem(accessTokenKey, loginResponse.accessToken)
    sessionStorage.setItem(userStorageKey, JSON.stringify(loginResponse.user))
  }

  function clearAuthentication() {
    accessToken.value = null
    user.value = null
    protectedMessage.value = null

    sessionStorage.removeItem(accessTokenKey)
    sessionStorage.removeItem(userStorageKey)
  }

  /**
   * POST /auth/login을 호출하고 응답받은 토큰과 프로필을 Store에 저장합니다.
   */
  async function login(email, password) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const result = await authApi.login({ email, password })
      saveAuthentication(result)
      return true
    } catch (error) {
      clearAuthentication()
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * POST /auth/signup을 호출합니다.
   * 서버가 가입과 동시에 토큰을 내려주므로, 성공하면 바로 로그인 상태가 됩니다.
   */
  async function signup(newMember) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const result = await authApi.signup(newMember)
      saveAuthentication(result)
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Axios 인터셉터가 토큰을 자동 첨부하는지 /auth/me 호출로 검증합니다.
   */
  async function fetchMyProfile() {
    try {
      const profile = await authApi.getMyProfile()
      user.value = profile
      sessionStorage.setItem(userStorageKey, JSON.stringify(profile))
      return profile
    } catch (error) {
      // 서버가 토큰을 거부하면 남아 있는 잘못된 인증 정보를 제거합니다.
      if (error.status === 401) clearAuthentication()
      throw error
    }
  }

  async function fetchProtectedMessage() {
    isLoading.value = true
    errorMessage.value = ''

    try {
      protectedMessage.value = await authApi.getProtectedMessage()
      return true
    } catch (error) {
      if (error.status === 401) clearAuthentication()
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    clearAuthentication()
    errorMessage.value = ''
  }

  return {
    accessToken,
    user,
    isLoading,
    errorMessage,
    protectedMessage,
    isLoggedIn,
    statusMessage,
    authorizationHeader,
    tokenPayload,
    login,
    signup,
    logout,
    fetchMyProfile,
    fetchProtectedMessage,
  }
})

