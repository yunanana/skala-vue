import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth.js'

/**
 * 모든 화면을 지연 로딩으로 등록한다. 처음 들어갈 때 그 화면 코드만 내려받는다.
 * 어디에도 걸리지 않는 경로를 받는 catch-all은 반드시 마지막에 둔다.
 */
const routes = [
  {
    path: '/',
    name: 'WeatherHome',
    component: () => import('@/views/WeatherHomeView.vue'),
  },
  {
    // 전국 명소를 지금 날씨로 줄 세워 보는 화면
    path: '/spots',
    name: 'Spots',
    component: () => import('@/views/SpotsView.vue'),
  },
  {
    path: '/about',
    name: 'WeatherAbout',
    component: () => import('@/views/WeatherAboutView.vue'),
  },
  {
    // :cityId 자리에 들어온 값을 페이지에서 route.params.cityId로 받는다
    path: '/weather/:cityId',
    name: 'WeatherDetail',
    component: () => import('@/views/WeatherDetailView.vue'),
  },
  {
    path: '/guide',
    name: 'Guide',
    component: () => import('@/views/WeatherLogView.vue'),
  },
  {
    path: '/saved',
    name: 'Saved',
    component: () => import('@/views/SavedView.vue'),
  },
  {
    path: '/journal',
    name: 'Journal',
    component: () => import('@/views/PostListView.vue'),
  },
  {
    path: '/kit',
    name: 'Kit',
    component: () => import('@/views/ProductListView.vue'),
    // 로그인해야 들어갈 수 있는 페이지 (Navigation Guard가 검사한다)
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/views/SignupView.vue'),
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import('@/views/MembersView.vue'),
    // 계정 정보를 다루므로 로그인해야 볼 수 있다
    meta: { requiresAuth: true },
  },

  // 예전 주소로 들어와도 새 화면으로 이어지게 한다 (북마크·배포본 링크 대비)
  { path: '/log', redirect: '/guide' },
  { path: '/map', redirect: '/' },
  { path: '/posts', redirect: '/journal' },
  { path: '/products', redirect: '/kit' },
  { path: '/members', redirect: '/account' },

  {
    // 위 어디에도 걸리지 않은 모든 경로 (반드시 마지막)
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  // BASE_URL을 넘겨야 하위 경로로 배포(GitHub Pages 등)했을 때도 라우팅이 맞는다
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 페이지를 이동하면 항상 맨 위에서 시작하도록
  scrollBehavior: () => ({ top: 0 }),
})

/**
 * Navigation Guard — meta.requiresAuth가 붙은 경로는 로그인 상태에서만 통과시킨다.
 * 막힌 경우 원래 목적지를 redirect 쿼리로 넘겨, 로그인 후 그 자리로 돌려보낸다.
 */
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
})

export default router
