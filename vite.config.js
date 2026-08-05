import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // 세 번째 인자를 ''로 주면 VITE_ 접두사가 없는 변수도 읽는다.
  // 이 값은 아래 프록시(개발 서버 = 서버 사이드)에서만 쓰여 번들에 포함되지 않는다.
  const env = loadEnv(mode, process.cwd(), '')

  // "계정/저장소" 형태에서 저장소 이름만 꺼낸다
  const repository = (process.env.GITHUB_REPOSITORY ?? '').split('/')[1] ?? ''
  const repositoryBase = !repository || repository.endsWith('.github.io') ? '/' : `/${repository}/`
  const openWeatherKey = env.OPENWEATHER_API_KEY ?? ''

  return {
    // GitHub Pages는 https://<계정>.github.io/<저장소>/ 아래에 놓이므로
    // 빌드 결과의 경로 앞에 저장소 이름을 붙인다.
    // 저장소 이름은 Actions가 알려 주므로(GITHUB_REPOSITORY) 직접 적지 않는다.
    // 계정 사이트(<계정>.github.io)와 개발 중에는 '/'를 쓴다.
    base: command === 'build' ? repositoryBase : '/',
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // 로컬 개발 서버
    server: {
      port: 3100,
      open: true,

      // 🔒 개발 중 OpenWeather 중계
      // 브라우저는 /api/weather 로만 요청하고, 개발 서버가 appid를 붙여 전달한다.
      // 배포 후에는 같은 역할을 api/weather.js 서버리스 함수가 맡는다.
      proxy: {
        '/api/weather': {
          target: 'https://api.openweathermap.org',
          changeOrigin: true,
          rewrite: (path) => {
            const requested = new URL(path, 'http://localhost')
            const type = requested.searchParams.get('type') === 'forecast' ? 'forecast' : 'weather'

            const upstream = new URLSearchParams()
            upstream.set('lat', requested.searchParams.get('lat') ?? '')
            upstream.set('lon', requested.searchParams.get('lon') ?? '')
            upstream.set('appid', openWeatherKey)
            upstream.set('units', 'metric')
            upstream.set('lang', 'kr')

            const cnt = requested.searchParams.get('cnt')
            if (cnt) upstream.set('cnt', cnt)

            return `/data/2.5/${type}?${upstream.toString()}`
          },
        },
      },
    },
    // 빌드 산출물
    build: {
      outDir: 'dist',
    },
  }
})
