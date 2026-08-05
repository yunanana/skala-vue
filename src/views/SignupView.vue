<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

import BaseDashboardCard from '@/components/weather/BaseDashboardCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  department: '',
})

/**
 * 화면에서 먼저 걸러 주는 검사.
 * 서버(mock-api/data/memberStore.js)도 같은 규칙으로 다시 검사한다.
 * 입력할 때마다 계산되므로 computed로 둔다.
 */
const fieldErrors = computed(() => ({
  name: form.name && form.name.trim().length < 2 ? '이름은 2글자 이상이어야 합니다.' : '',
  email: form.email && !/^\S+@\S+\.\S+$/.test(form.email) ? '이메일 형식이 올바르지 않습니다.' : '',
  password: form.password && form.password.length < 4 ? '비밀번호는 4자 이상이어야 합니다.' : '',
  passwordConfirm:
    form.passwordConfirm && form.password !== form.passwordConfirm
      ? '비밀번호가 서로 다릅니다.'
      : '',
}))

// 필수 항목이 모두 채워졌고 오류가 하나도 없을 때만 제출 버튼을 연다
const canSubmit = computed(
  () =>
    Boolean(form.name && form.email && form.password && form.passwordConfirm) &&
    Object.values(fieldErrors.value).every((message) => !message),
)

const submitSignup = async () => {
  if (!canSubmit.value) return

  const success = await authStore.signup({
    name: form.name,
    email: form.email,
    password: form.password,
    department: form.department,
  })

  // 가입과 동시에 로그인 상태가 되므로 바로 회원 목록으로 보낸다
  if (success) router.push('/members')
}
</script>

<template>
  <PageHeader
    :index="7"
    eyebrow="Sign up"
    title="회원가입"
    desc="계정을 만들면 저장한 지역과 기록이 그대로 이어집니다."
  >
    <template #meta>
      <span class="eyebrow">1분이면 끝납니다</span>
    </template>
  </PageHeader>

  <div class="dashboard-wrapper">
    <!-- 이미 로그인한 사람에게는 폼 대신 안내를 보여 준다 -->
    <BaseDashboardCard v-if="authStore.isLoggedIn">
      <div class="box-head">
        <h3>이미 로그인되어 있습니다</h3>
      </div>
      <p class="hint">
        {{ authStore.user.name }}님으로 로그인한 상태입니다. 다른 계정을 만들려면 먼저
        로그아웃해 주세요.
      </p>
      <div class="form-actions">
        <button type="button" @click="router.push('/members')">회원 목록 보기</button>
        <button type="button" @click="authStore.logout()">로그아웃</button>
      </div>
    </BaseDashboardCard>

    <BaseDashboardCard v-else>
      <div class="box-head">
        <h3>계정 만들기</h3>
        <RouterLink to="/login" class="text-link">이미 계정이 있어요 →</RouterLink>
      </div>

      <form class="data-form" @submit.prevent="submitSignup">
        <label class="field">
          <span>이름 <em>필수</em></span>
          <input
            v-model.trim="form.name"
            type="text"
            autocomplete="name"
            placeholder="홍길동"
            maxlength="20"
          />
          <small v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</small>
        </label>

        <label class="field">
          <span>이메일 <em>필수</em></span>
          <input
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            placeholder="me@weather.app"
          />
          <small v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</small>
        </label>

        <label class="field">
          <span>비밀번호 <em>필수</em></span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            placeholder="4자 이상"
          />
          <small v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</small>
        </label>

        <label class="field">
          <span>비밀번호 확인 <em>필수</em></span>
          <input
            v-model="form.passwordConfirm"
            type="password"
            autocomplete="new-password"
            placeholder="한 번 더 입력"
          />
          <small v-if="fieldErrors.passwordConfirm" class="field-error">
            {{ fieldErrors.passwordConfirm }}
          </small>
        </label>

        <label class="field">
          <span>소속</span>
          <input
            v-model.trim="form.department"
            type="text"
            placeholder="비워두면 미지정"
            maxlength="30"
          />
        </label>

        <!-- 서버가 돌려준 오류 (중복 이메일 등) -->
        <p v-if="authStore.errorMessage" class="state-msg error">{{ authStore.errorMessage }}</p>

        <div class="form-actions">
          <button type="submit" class="primary" :disabled="!canSubmit || authStore.isLoading">
            {{ authStore.isLoading ? '가입 처리 중…' : '가입하기' }}
          </button>
        </div>
      </form>
    </BaseDashboardCard>

    <div class="status-bar">{{ authStore.statusMessage }}</div>
  </div>
</template>

<style scoped>
.box-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.box-head h3 {
  margin: 0;
}

.text-link {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.text-link:hover {
  color: var(--accent);
}

.data-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 380px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field > span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.field em {
  font-style: normal;
  font-size: 0.6rem;
  color: var(--accent);
}

.field-error {
  font-size: 0.75rem;
  color: var(--accent);
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
}

.hint {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.state-msg {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent);
  font-size: 0.82rem;
}

.state-msg.error {
  color: var(--accent);
}
</style>
