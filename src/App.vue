<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import WeatherEffect from '@/components/WeatherEffect.vue'
import SiteTicker from '@/components/SiteTicker.vue'
import { fxMode } from '@/utils/weatherFx.js'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useWeatherStore } from '@/stores/weatherStore.js'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

/**
 * 로그인이 풀렸는데 보호된 페이지에 머무르는 상황을 막는다.
 *
 * 라우터 가드는 "이동할 때"만 검사하므로, 이미 그 페이지에 있는 상태로
 * 로그아웃하거나 토큰이 만료되면 가드가 다시 돌지 않는다.
 * 로그인 상태 자체를 지켜보다가 그때 로그인 화면으로 보낸다.
 */
watch(
  () => authStore.isLoggedIn,
  (isLoggedIn) => {
    if (!isLoggedIn && route.meta.requiresAuth) {
      router.push({ name: 'Login', query: { redirect: route.fullPath } })
    }
  },
)

/* ---------------- 다크 / 라이트 모드 ---------------- */
// index.html에서 미리 적용해 둔 클래스를 초기값으로 읽는다
const isDark = ref(document.documentElement.classList.contains('theme-dark'))

// 값이 바뀔 때마다 html 태그의 클래스와 localStorage를 갱신
watch(isDark, (dark) => {
  document.documentElement.classList.toggle('theme-dark', dark)
  localStorage.setItem('theme', dark ? 'dark' : 'light')
})

/* ---------------- 상단 바의 시계 ---------------- */
// 서울과 UTC 시각을 1초마다 갱신한다
const now = ref(new Date())
const timer = setInterval(() => (now.value = new Date()), 1000)
onUnmounted(() => clearInterval(timer))

const formatTime = (timeZone) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now.value)

const seoulTime = computed(() => formatTime('Asia/Seoul'))
const utcTime = computed(() => formatTime('UTC'))

// 상단 바에 지금 보고 있는 지역의 날씨를 띄운다
const weatherStore = useWeatherStore()
const currentSummary = computed(() => {
  const now = weatherStore.current
  return now ? `${now.name} ${now.temp}° ${now.status}` : ''
})

// 하단 알약 내비게이션에 들어갈 항목 (v-for로 그린다)
const navItems = [
  { to: '/', label: '날씨' },
  { to: '/spots', label: '명소' },
  { to: '/saved', label: '저장' },
  { to: '/guide', label: '가이드' },
  { to: '/about', label: '소개' },
]

const tickerItems = [
  '날씨는 하루를 움직이는 방식을 바꾼다',
  'WEATHER CHANGES HOW WE MOVE THROUGH A CITY',
  '오늘 무엇을 입고 어디로 갈지',
  'BETWEEN WEATHER',
  '지역을 고르고 하루를 기록하세요',
]
</script>

<template>
  <!-- 배경: 아주 옅은 체커보드 (고정, 콘텐츠 뒤) -->
  <div class="checker-bg" aria-hidden="true"></div>
  <!-- 선택한 지역이 비/눈이면 화면 전체에 내리는 효과 -->
  <WeatherEffect :mode="fxMode" />

  <!-- 상단 고정 영역 (상태 바 + 흐르는 띠를 한 덩이로 묶어 서로 겹치지 않게 한다) -->
  <header class="chrome">
    <nav class="status-bar">
    <RouterLink to="/" class="bar-cell brand" aria-label="홈">
      BETWEEN<span class="slash">·</span>WEATHER
    </RouterLink>

    <!-- 지금 시각 (1초마다 갱신) -->
    <div class="bar-cell clock">서울 {{ seoulTime }}</div>
    <div class="bar-cell clock wide">UTC {{ utcTime }}</div>
    <!-- 지금 보고 있는 지역의 요약 (없으면 칸 자체를 감춘다) -->
    <div v-if="currentSummary" class="bar-cell wide current">{{ currentSummary }}</div>

    <div class="bar-cell actions">
      <RouterLink v-if="!authStore.isLoggedIn" to="/login" class="auth-link">로그인</RouterLink>
      <RouterLink v-if="!authStore.isLoggedIn" to="/signup" class="auth-link">가입</RouterLink>
      <template v-else>
        <RouterLink to="/account" class="auth-user">{{ authStore.user.name }}</RouterLink>
        <button class="ghost-btn" @click="authStore.logout()">로그아웃</button>
      </template>

      <button
        class="ghost-btn theme-btn"
        :aria-label="isDark ? '밝은 화면으로' : '어두운 화면으로'"
        @click="isDark = !isDark"
      >
        {{ isDark ? 'LIGHT' : 'DARK' }}
      </button>
    </div>
    </nav>

    <!-- 상단 바 아래를 흐르는 띠 -->
    <SiteTicker :items="tickerItems" :duration="46" />
  </header>

  <div class="container">
    <main class="practice-container">
      <RouterView />
    </main>
  </div>

  <!-- 화면 아래 떠 있는 알약 모양 내비게이션 (페이지 이동은 여기 한 곳에서만) -->
  <nav class="pill-nav" aria-label="페이지 이동">
    <RouterLink to="/" class="pill-brand">B·W</RouterLink>
    <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">{{ item.label }}</RouterLink>
  </nav>
</template>

<style>
@import '@/assets/layout.css';

/* 배경 체커보드가 비치도록 페이지 자체는 투명하게 둔다 */
body {
  background: transparent;
}
</style>

<style scoped>
/* ---------------- 상단 고정 영역 ---------------- */
.chrome {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.status-bar {
  height: var(--nav-height);
  display: flex;
  align-items: stretch;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  letter-spacing: var(--label-spacing);
  text-transform: uppercase;
}

/* 바 안의 칸은 헤어라인으로 나눈다 */
.bar-cell {
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-right: 1px solid var(--border);
  color: var(--text-muted);
  white-space: nowrap;
}

.brand {
  font-weight: 600;
  color: var(--text);
}

.brand:hover {
  color: var(--accent);
}

.slash {
  margin: 0 2px;
  color: var(--accent);
}

.clock {
  font-variant-numeric: tabular-nums;
}

/* 지금 보고 있는 지역 요약 — 한글이 섞이므로 대문자 변환을 끈다 */
.current {
  color: var(--text);
  text-transform: none;
}

.actions {
  gap: 10px;
  margin-left: auto;
  border-right: 0;
  border-left: 1px solid var(--border);
}

.auth-link:hover {
  color: var(--accent);
}

.auth-user {
  color: var(--text);
  text-transform: none;
}

.auth-user:hover {
  color: var(--accent);
}

/* 바 안에서 쓰는 납작한 버튼 */
.ghost-btn {
  margin: 0;
  padding: 3px 8px;
  border: 1px solid transparent;
  font-size: var(--label-size);
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.ghost-btn:not(:disabled):hover {
  background: transparent;
  border-color: var(--border);
  color: var(--accent);
}

.theme-btn {
  min-width: 62px;
  justify-content: center;
}

/* ---------------- 본문 ---------------- */
.container {
  position: relative;
  z-index: 1;
  padding-top: 16px;
}

/* ---------------- 하단 알약 내비게이션 ---------------- */
.pill-nav {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100vw - 24px);
  padding: 5px;
  /* 알약 모양 — 화면에서 유일하게 둥근 요소 */
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow-x: auto;
  scrollbar-width: none;
}

.pill-nav::-webkit-scrollbar {
  display: none;
}

.pill-nav a {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

.pill-nav a:hover {
  background: var(--bg-hover);
  color: var(--text);
}

/* 현재 페이지 링크는 라우터가 자동으로 이 클래스를 붙여준다 */
.pill-nav a.router-link-exact-active {
  background: var(--accent);
  color: var(--accent-ink);
}

.pill-brand {
  font-family: var(--font-mono);
  font-size: var(--label-size) !important;
  letter-spacing: var(--label-spacing);
  color: var(--text) !important;
  border: 1px solid var(--border);
}

.pill-brand.router-link-exact-active {
  background: transparent !important;
  color: var(--text) !important;
}

@media (max-width: 900px) {
  .clock.wide,
  .bar-cell.wide {
    display: none;
  }
}

@media (max-width: 750px) {
  .status-bar {
    overflow-x: auto;
  }
  .bar-nav a,
  .bar-cell {
    padding: 0 10px;
  }
  .container {
    padding-top: 8px;
  }
}
</style>
