<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WeatherDetail from '@/components/weather/WeatherDetail.vue'
import PageHeader from '@/components/PageHeader.vue'
import { CITIES, getMockWeather } from '@/data/cities.js'
import { fetchCityWeather, fetchCityForecast } from '@/api/weather.js'
import { fxMode, modeFromWeatherId } from '@/utils/weatherFx.js'

// 동적 경로(/weather/:cityId)로 들어온 지역 id
const route = useRoute()
const router = useRouter()
const cityId = route.params.cityId

const city = ref(null)
const forecast = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const isFallback = ref(false) // 참고 데이터로 표시 중인지

onMounted(async () => {
  // ID로 도시 정보(좌표)를 찾는다. 없는 ID면 안내 후 종료.
  const target = CITIES.find((c) => c.id === cityId)
  if (!target) {
    errorMessage.value = `'${cityId}' 에 해당하는 지역을 찾을 수 없습니다.`
    isLoading.value = false
    return
  }

  try {
    // 마운트 시점에 해당 도시의 현재 날씨와 예보를 함께 조회
    const [current, fc] = await Promise.all([fetchCityWeather(target), fetchCityForecast(target)])
    city.value = current
    forecast.value = fc
    fxMode.value = modeFromWeatherId(current.weatherId)
  } catch {
    // 통신이 실패해도 화면이 비지 않도록 참고 데이터로 대신한다
    city.value = getMockWeather(cityId)
    isFallback.value = true
    if (!city.value) errorMessage.value = '날씨 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
})

/** 뒤로 가기 (히스토리가 없으면 홈으로) */
const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <PageHeader
    eyebrow="Region"
    :title="city ? city.name : '지역 상세'"
    desc="이 지역의 지금 상태와 3시간 단위 예보입니다."
  />

  <div class="dashboard-wrapper">
    <p v-if="isLoading" class="state-msg">불러오는 중입니다…</p>
    <p v-else-if="errorMessage" class="state-msg error">{{ errorMessage }}</p>

    <template v-else-if="city">
      <p v-if="isFallback" class="fallback-notice">
        실시간 연결이 원활하지 않아 최근 기준값을 표시합니다.
      </p>
      <WeatherDetail :city-item="city" :forecast="forecast" />
    </template>

    <div class="actions">
      <button @click="goBack">← 뒤로</button>
      <RouterLink to="/" class="link-btn">대시보드로</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page-desc code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  padding: 1px 5px;
  border: 1px solid var(--border);
}

.state-msg {
  padding: 40px 0;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.fallback-notice {
  margin-bottom: 16px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-left: 2px solid var(--text);
  background: var(--bg-subtle);
  font-family: var(--font-mono);
  font-size: 0.78rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.actions button {
  margin: 0;
}

.link-btn {
  display: inline-block;
  padding: 6px 12px;
  border: 1px solid var(--border);
  font-size: 0.85rem;
  font-weight: 500;
}

.link-btn:hover {
  border-color: var(--hover-border);
  background: var(--bg-hover);
  color: var(--text);
}
</style>
