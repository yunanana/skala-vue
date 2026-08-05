<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseDashboardCard from '@/components/weather/BaseDashboardCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({ email: '', password: '' })
const showToken = ref(false)

// 미리 만들어 둔 계정
const sampleAccounts = [
  { email: 'user@weather.app', password: '1234', label: '일반' },
  { email: 'admin@weather.app', password: 'admin1234', label: '관리자' },
]

const fillAccount = (account) => {
  form.email = account.email
  form.password = account.password
}

const submitLogin = async () => {
  const success = await authStore.login(form.email, form.password)
  if (!success) return

  // 보호된 페이지로 가려다 막힌 경우 원래 목적지로 돌려보낸다
  const redirect = route.query.redirect
  router.push(typeof redirect === 'string' ? redirect : '/')
}

const testProtectedApi = () => authStore.fetchProtectedMessage()
</script>

<template>
  <PageHeader
    :index="6"
    eyebrow="Sign in"
    title="로그인"
    desc="로그인하면 저장한 지역과 기록을 이어서 볼 수 있습니다."
  >
    <template #meta>
      <span class="eyebrow">{{ authStore.isLoggedIn ? '로그인됨' : '비로그인' }}</span>
    </template>
  </PageHeader>

  <div class="dashboard-wrapper">
    <!-- 로그인 전 -->
    <BaseDashboardCard v-if="!authStore.isLoggedIn">
      <div class="box-head">
        <h3><span class="method">POST</span> /api/auth/login</h3>
      </div>

      <form class="data-form" @submit.prevent="submitLogin">
        <label class="field">
          <span>이메일</span>
          <input v-model.trim="form.email" type="email" autocomplete="username" placeholder="user@weather.app" />
        </label>

        <label class="field">
          <span>비밀번호</span>
          <input v-model="form.password" type="password" autocomplete="current-password" placeholder="비밀번호" />
        </label>

        <p v-if="authStore.errorMessage" class="state-msg error">{{ authStore.errorMessage }}</p>

        <div class="form-actions">
          <button type="submit" class="primary" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? '로그인 중…' : '로그인' }}
          </button>
          <RouterLink to="/signup" class="signup-link">회원가입 →</RouterLink>
        </div>
      </form>

      <div class="sample-box">
        <p class="sample-title">체험용 계정</p>
        <button v-for="account in sampleAccounts" :key="account.email" type="button" @click="fillAccount(account)">
          {{ account.label }} · {{ account.email }}
        </button>
      </div>
    </BaseDashboardCard>

    <!-- 로그인 후 -->
    <template v-else>
      <BaseDashboardCard>
        <div class="box-head">
          <h3>내 프로필</h3>
          <button @click="authStore.logout()">로그아웃</button>
        </div>

        <dl class="metric-grid">
          <div><dt>이름</dt><dd>{{ authStore.user.name }}</dd></div>
          <div><dt>이메일</dt><dd>{{ authStore.user.email }}</dd></div>
          <div><dt>권한</dt><dd>{{ authStore.user.role }}</dd></div>
          <div><dt>소속</dt><dd>{{ authStore.user.department }}</dd></div>
        </dl>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <div class="box-head">
          <h3><span class="method">GET</span> 보호된 API 호출</h3>
          <button @click="testProtectedApi">호출 테스트</button>
        </div>

        <p class="hint">
          요청 인터셉터가 <code>Authorization: Bearer …</code> 헤더를 자동으로 붙입니다.
        </p>

        <p v-if="authStore.protectedMessage" class="state-msg">
          {{ authStore.protectedMessage.message }}
        </p>
        <p v-else-if="authStore.errorMessage" class="state-msg error">{{ authStore.errorMessage }}</p>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <div class="box-head">
          <h3>로그인 정보</h3>
          <button @click="showToken = !showToken">{{ showToken ? '숨기기' : '펼치기' }}</button>
        </div>

        <pre v-if="showToken" class="token-body">{{ JSON.stringify(authStore.tokenPayload, null, 2) }}</pre>
        <p v-else class="hint">토큰에 담긴 정보를 확인할 수 있습니다. (서명은 서버만 검증)</p>
      </BaseDashboardCard>
    </template>

    <div class="status-bar">{{ authStore.statusMessage }}</div>
  </div>
</template>

<style scoped>
.box-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.box-head h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.box-head button {
  margin: 0;
}

.method {
  padding: 2px 7px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.data-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 340px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field > span {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-actions button {
  margin: 0;
}

/* 로그인 버튼 옆에 두는 회원가입 링크 */
.signup-link {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.signup-link:hover {
  color: var(--accent);
}

.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
}

.primary:not(:disabled):hover {
  background: var(--text);
  border-color: var(--text);
  opacity: 0.85;
}

.sample-box {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.sample-title {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.sample-box button {
  margin: 0 6px 0 0;
  font-size: 0.75rem;
  font-family: var(--font-mono);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  margin: 0;
}

.metric-grid > div {
  background: var(--bg);
  padding: 10px 12px;
}

.metric-grid dt {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
}

.metric-grid dd {
  margin: 3px 0 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--bg-hover);
  padding: 1px 5px;
  border: 1px solid var(--border);
}

.token-body {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.7;
  color: var(--text-meta);
  white-space: pre-wrap;
  word-break: break-all;
}

.state-msg {
  padding: 10px 0;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--text-muted);
}

.state-msg.error {
  color: var(--text);
  border-left: 2px solid var(--text);
  padding-left: 12px;
}
</style>
