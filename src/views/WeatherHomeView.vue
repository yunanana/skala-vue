<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import BaseDashboardCard from '@/components/weather/BaseDashboardCard.vue'
import SearchBar from '@/components/weather/SearchBar.vue'
import KoreaMap from '@/components/weather/KoreaMap.vue'
import WeatherDetail from '@/components/weather/WeatherDetail.vue'
import LoadingPanel from '@/components/LoadingPanel.vue'
import ErrorPanel from '@/components/ErrorPanel.vue'
import SpotCard from '@/components/SpotCard.vue'
import IntroLoader from '@/components/IntroLoader.vue'
import HeroIndex from '@/components/HeroIndex.vue'
import { useWeatherStore } from '@/stores/weatherStore.js'
import { CITIES } from '@/data/cities.js'
import { spotsByCity } from '@/data/spots.js'
import { rankSpots, buildVerdict } from '@/utils/spotMatch.js'
import { fetchAllCitiesWeather, fetchCityForecast } from '@/api/weather.js'
import { fxMode, modeFromWeatherId } from '@/utils/weatherFx.js'
import { applySkyFromWeather } from '@/utils/skyTheme.js'

// 저장한 지역·최근 본 지역을 담는 저장소
const weatherStore = useWeatherStore()

/* ---------------- 첫 진입 화면 ---------------- */
// 한 번 본 사람에게는 다시 보여 주지 않는다 (같은 탭 안에서)
const introSeen = sessionStorage.getItem('bw-intro') === 'seen'
const showIntro = ref(!introSeen)
const introDone = ref(introSeen)
const loadedCount = ref(0)
const totalCount = ref(CITIES.length)

// 실제로 받은 지역 수가 목표값이 된다
const targetProgress = computed(() =>
  totalCount.value ? (loadedCount.value / totalCount.value) * 100 : 0,
)

/**
 * 화면에 보이는 숫자는 목표값을 조금씩 따라간다.
 * 응답이 순식간에 와도 숫자가 훌쩍 뛰지 않고 올라가는 모습이 보인다.
 */
const progress = ref(0)
let progressFrame = null

const runCounter = () => {
  progressFrame = requestAnimationFrame(function step() {
    const gap = targetProgress.value - progress.value
    progress.value = Math.min(targetProgress.value, progress.value + Math.max(gap * 0.08, 0.6))

    if (progress.value < targetProgress.value - 0.5) {
      progressFrame = requestAnimationFrame(step)
      return
    }

    progress.value = targetProgress.value
    progressFrame = null
  })
}

watch(targetProgress, () => {
  if (!showIntro.value || progressFrame) return
  runCounter()
})

onUnmounted(() => progressFrame && cancelAnimationFrame(progressFrame))

// 너무 빨리 지나가면 오히려 화면이 깜빡인 것처럼 보인다
const introStartedAt = Date.now()
const MIN_INTRO_MS = 1400

const finishIntro = () => {
  const wait = Math.max(0, MIN_INTRO_MS - (Date.now() - introStartedAt))

  setTimeout(() => {
    progress.value = 100
    introDone.value = true
    sessionStorage.setItem('bw-intro', 'seen')
    // 걷히는 동안 화면에 남겨 두었다가 정리한다
    setTimeout(() => (showIntro.value = false), 600)
  }, wait)
}

// 서버에서 받아온 날씨 목록 (처음엔 비어 있다)
const weatherList = ref([])
// onMounted에서 바로 조회하므로 처음부터 로딩 상태로 시작한다
const isLoading = ref(true)
const errorMessage = ref('')
const failedCities = ref([])
const updatedAt = ref('')

const searchQuery = ref('')
const selectedId = ref('')

// 선택된 지역의 단기 예보
const forecast = ref([])
const isForecastLoading = ref(false)

// 검색어로 걸러낸 목록 (지도와 목록이 함께 이 값을 쓴다)
const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(query))
})

// 선택된 지역 객체 (상세 패널에 넘길 값)
const selectedCity = computed(
  () => weatherList.value.find((c) => c.id === selectedId.value) ?? null,
)

// 선택한 지역의 날씨로 갈 만한 곳을 줄 세운다 (날씨가 바뀌면 순위도 바뀐다)
const rankedSpots = computed(() =>
  selectedCity.value ? rankSpots(spotsByCity(selectedCity.value.id), selectedCity.value) : [],
)
const topSpots = computed(() => rankedSpots.value.slice(0, 3))

// 지금 날씨에 대한 한 줄 결론
const verdict = computed(() => buildVerdict(selectedCity.value))

/** 전체 지역의 현재 날씨를 받아온다 */
const loadWeather = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { list, failed } = await fetchAllCitiesWeather((loaded, total) => {
      loadedCount.value = loaded
      totalCount.value = total
    })
    weatherList.value = list
    failedCities.value = failed
    updatedAt.value = new Date().toLocaleTimeString('ko-KR')

    // 선택이 없으면 첫 번째 도시를 자동 선택해 화면이 비어 보이지 않게 한다
    if (!selectedId.value && list.length) selectCity(list[0])
  } catch {
    errorMessage.value = '실시간 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoading.value = false
    if (!introDone.value) finishIntro()
  }
}

// 화면 효과를 직접 골라 볼 수 있게 한다
const fxPreview = ref('')
const setPreview = (mode) => {
  fxPreview.value = mode
  fxMode.value = mode || modeFromWeatherId(selectedCity.value?.weatherId)
}

/** 지도나 카드에서 지역이 선택됐을 때 */
const selectCity = (item) => {
  selectedId.value = item.id

  // 선택한 지역이 비/눈이면 화면 전체에 그 효과를 켠다
  if (!fxPreview.value) fxMode.value = modeFromWeatherId(item.weatherId)

  // 배경 도트 색도 그 지역 날씨에 맞춘다
  applySkyFromWeather(item)

  // 상단 바 요약과 최근 본 지역을 갱신한다
  weatherStore.markViewed(item)
}


// 선택이 바뀌면 그 지역의 예보를 새로 불러온다
watch(selectedId, async (id) => {
  const city = weatherList.value.find((c) => c.id === id)
  if (!city) return

  isForecastLoading.value = true
  forecast.value = []
  try {
    forecast.value = await fetchCityForecast(city)
  } catch {
    // 예보를 못 받아도 현재 날씨는 그대로 보여 준다
    forecast.value = []
  } finally {
    isForecastLoading.value = false
  }
})

// 화면이 붙은 직후가 API를 호출하기 가장 좋은 타이밍
onMounted(loadWeather)

const router = useRouter()

/** 지역 상세 화면으로 이동한다 */
const goDetail = (item) => {
  router.push(`/weather/${item.id}`)
}
</script>

<template>
  <IntroLoader
    v-if="showIntro"
    :progress="progress"
    :loaded="loadedCount"
    :total="totalCount"
    :done="introDone"
  />

  <!-- 첫 화면을 가득 채우는 지금 날씨 -->
  <section v-if="selectedCity" class="hero">
    <div class="hero-top">
      <span class="hero-eyebrow">(01) Now</span>
      <span class="hero-place">
        {{ selectedCity.name }} · {{ selectedCity.lat.toFixed(2) }}N {{ selectedCity.lon.toFixed(2) }}E
      </span>
      <span class="hero-count">{{ filteredWeatherList.length }}개 지역 · {{ updatedAt }} 기준</span>
    </div>

    <div class="hero-mid">
      <div class="hero-reading">
        <span class="hero-temp" aria-hidden="true">{{ selectedCity.temp }}<i>°</i></span>
        <h2 class="hero-city">{{ selectedCity.name }}</h2>
      </div>

      <HeroIndex />
    </div>

    <div class="hero-bottom">
      <dl class="hero-stats">
        <div><dt>하늘</dt><dd>{{ selectedCity.status }}</dd></div>
        <div><dt>체감</dt><dd>{{ selectedCity.feelsLike }}°</dd></div>
        <div><dt>습도</dt><dd>{{ selectedCity.humidity }}%</dd></div>
        <div><dt>바람</dt><dd>{{ selectedCity.windSpeed }}m/s</dd></div>
      </dl>

      <p class="hero-cue">Scroll ↓</p>
    </div>
  </section>

  <div class="dashboard-wrapper">
    <BaseDashboardCard>
      <SearchBar :current-query="searchQuery" @update-query="(val) => (searchQuery = val)" />
    </BaseDashboardCard>

    <!-- 지도: 지역을 고르는 곳 -->
    <BaseDashboardCard id="map">
      <div class="box-head">
        <h3>지역 선택</h3>
        <div class="box-actions">
          <span class="stamp">효과</span>
          <div class="fx-toggle">
            <button :class="{ on: fxPreview === '' }" @click="setPreview('')">자동</button>
            <button :class="{ on: fxPreview === 'clear' }" @click="setPreview('clear')">맑음</button>
            <button :class="{ on: fxPreview === 'cloud' }" @click="setPreview('cloud')">흐림</button>
            <button :class="{ on: fxPreview === 'rain' }" @click="setPreview('rain')">비</button>
            <button :class="{ on: fxPreview === 'snow' }" @click="setPreview('snow')">눈</button>
          </div>
          <span v-if="updatedAt" class="stamp">{{ updatedAt }} 기준</span>
          <button :disabled="isLoading" @click="loadWeather">
            {{ isLoading ? '불러오는 중…' : '새로고침' }}
          </button>
        </div>
      </div>

      <LoadingPanel
        v-if="isLoading && weatherList.length === 0"
        message="지금 날씨를 확인하는 중입니다"
        :rows="6"
      />
      <ErrorPanel
        v-else-if="errorMessage"
        :message="errorMessage"
        :busy="isLoading"
        @retry="loadWeather"
      />
      <KoreaMap
        v-else
        :city-items="filteredWeatherList"
        :selected-id="selectedId"
        @select-city="selectCity"
      />

      <p v-if="failedCities.length" class="state-msg">
        일부 지역은 정보를 받지 못했습니다: {{ failedCities.join(', ') }}
      </p>
    </BaseDashboardCard>

    <!-- 상세: 선택한 지역 하나만 -->
    <BaseDashboardCard>
      <div v-if="selectedCity" class="box-head">
        <h3>선택한 지역</h3>
        <div class="box-actions">
          <button
            :class="{ on: weatherStore.isSaved(selectedCity.id) }"
            @click="weatherStore.toggleSaved(selectedCity.id)"
          >
            {{ weatherStore.isSaved(selectedCity.id) ? '저장됨' : '이 지역 저장' }}
          </button>
          <RouterLink to="/saved" class="more-link">저장 목록 보기 →</RouterLink>
          <button @click="goDetail(selectedCity)">자세히 보기</button>
        </div>
      </div>

      <WeatherDetail
        :city-item="selectedCity"
        :forecast="forecast"
        :is-loading="isForecastLoading"
      />
    </BaseDashboardCard>

    <!-- 이 날씨에 갈 만한 곳 (날씨가 바뀌면 순위가 바뀐다) -->
    <BaseDashboardCard v-if="selectedCity" id="picks">
      <div class="box-head">
        <h3>이 날씨에 가기 좋은 곳</h3>
        <RouterLink to="/spots" class="more-link">전국 명소 보기 →</RouterLink>
      </div>

      <p class="verdict">{{ verdict.headline }}</p>
      <p class="verdict-detail">{{ verdict.detail }}</p>

      <div class="spot-grid">
        <SpotCard
          v-for="(spot, position) in topSpots"
          :key="spot.id"
          v-reveal="position * 90"
          :spot="spot"
          :rank="position + 1"
          :saved="weatherStore.isSpotSaved(spot.id)"
          @toggle-save="weatherStore.toggleSpot(spot.id)"
        />
      </div>
    </BaseDashboardCard>

  </div>
</template>

<style scoped>
/* ---------------- 첫 화면 (한 프레임을 가득 채운다) ---------------- */
.hero {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* 상단 고정 영역을 뺀 나머지를 전부 쓴다 */
  /* 상단 고정 영역을 뺀 화면 한 판 (svh는 모바일 주소창을 고려한 값) */
  min-height: calc(100svh - var(--chrome-top) - 34px);
  padding: 20px 0 26px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 26px;
  /* 구름이 화면 밖으로 흘러넘쳐도 가로 스크롤이 생기지 않게 한다 */
  overflow-x: clip;
}

.hero-top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.hero-top,
.hero-cue {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.hero-eyebrow {
  color: var(--accent-text);
}

.hero-place {
  color: var(--text);
}

.hero-mid {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  align-items: center;
  gap: 20px;
  min-height: 0;
}

.hero-reading {
  position: relative;
}

@media (max-width: 900px) {
  .hero-mid {
    grid-template-columns: 1fr;
    align-items: start;
  }
}

/* 기온이 화면의 주인공 */
.hero-temp {
  font-family: var(--font-mono);
  font-size: clamp(6rem, 22vw, 17rem);
  font-weight: 700;
  line-height: 0.76;
  letter-spacing: -0.07em;
  color: var(--accent-tint);
  user-select: none;
}

.hero-temp i {
  font-style: normal;
  font-size: 0.4em;
  vertical-align: super;
}

/* 지역 이름을 숫자 위에 겹친다 */
.hero-city {
  position: absolute;
  left: 0;
  bottom: 8%;
  margin: 0;
  font-size: clamp(2.2rem, 7.5vw, 6rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 1;
  mix-blend-mode: multiply;
}

.theme-dark .hero-city {
  mix-blend-mode: screen;
}

.hero-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border-left: 1px solid var(--border);
}

.hero-stats > div {
  padding: 0 18px;
  border-right: 1px solid var(--border);
}

.hero-stats dt {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.hero-stats dd {
  margin: 5px 0 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.hero-cue {
  animation: cue 2.4s ease-in-out infinite;
}

@keyframes cue {
  50% {
    transform: translateY(4px);
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-cue {
    animation: none;
  }
}

@media (max-width: 750px) {
  .hero {
    min-height: calc(100vh - var(--chrome-top) - 20px);
  }
  .hero-stats > div {
    padding: 0 12px;
  }
  .hero-stats dd {
    font-size: 1rem;
  }
}

/* ---------------- 이 날씨에 가기 좋은 곳 ---------------- */
.more-link {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.more-link:hover {
  color: var(--accent-text);
}

.verdict {
  font-size: clamp(1.3rem, 2.6vw, 1.9rem);
  font-weight: 700;
  letter-spacing: -0.035em;
}

.verdict-detail {
  margin: 6px 0 18px;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.spot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.box-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.box-head h3 {
  margin: 0;
}

.box-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stamp {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
}

.box-head button {
  margin: 0;
}

.fx-toggle {
  display: flex;
}

.fx-toggle button {
  margin: 0 0 0 -1px;
  padding: 3px 9px;
  font-size: 0.72rem;
}

.fx-toggle button.on {
  background: var(--text);
  border-color: var(--text);
  color: var(--bg);
}

.state-msg {
  padding: 16px 0;
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
