<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import PageHeader from '@/components/PageHeader.vue'
import IndexRow from '@/components/IndexRow.vue'
import LoadingPanel from '@/components/LoadingPanel.vue'
import ErrorPanel from '@/components/ErrorPanel.vue'
import { fetchCityWeather } from '@/api/weather.js'
import { SPOTS } from '@/data/spots.js'
import { useWeatherStore } from '@/stores/weatherStore.js'
import { useConfigStore } from '@/stores/configStore.js'

const router = useRouter()
const weatherStore = useWeatherStore()
const configStore = useConfigStore()

// 저장한 지역의 현재 날씨 (id -> 날씨)
const weatherById = ref({})
const isLoading = ref(false)
const errorMessage = ref('')

const savedCities = computed(() => weatherStore.savedCities)

/** 명소 화면에서 저장해 둔 장소 */
const savedSpots = computed(() =>
  weatherStore.courseSpotIds.map((id) => SPOTS.find((spot) => spot.id === id)).filter(Boolean),
)

const cityNameOf = (cityId) => savedCities.value.find((c) => c.id === cityId)?.name ?? ''

/** 저장한 지역들을 한 번에 조회한다 */
const loadSaved = async () => {
  if (savedCities.value.length === 0) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const results = await Promise.all(
      savedCities.value.map(async (city) => [city.id, await fetchCityWeather(city)]),
    )
    weatherById.value = Object.fromEntries(results)
  } catch {
    errorMessage.value = '저장한 지역의 날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoading.value = false
  }
}

/** 설정한 단위로 표시값만 바꾼다 (원본은 항상 섭씨) */
const toDisplayTemp = (temp) =>
  configStore.unit === 'fahrenheit' ? Math.round((temp * 9) / 5 + 32) : temp

/** 저장한 지역 중 지금 가장 나가기 좋은 곳 */
const bestPick = computed(() => {
  const entries = savedCities.value
    .map((city) => ({ city, weather: weatherById.value[city.id] }))
    .filter((entry) => entry.weather)

  if (entries.length < 2) return null

  // 18~24°C에서 가장 멀지 않고, 비가 오지 않는 곳을 고른다
  const score = ({ weather }) => {
    const gap = weather.temp < 18 ? 18 - weather.temp : weather.temp > 24 ? weather.temp - 24 : 0
    return gap * 4 + (weather.rain > 0 ? 30 : 0)
  }

  return entries.reduce((best, entry) => (score(entry) < score(best) ? entry : best))
})

const goDetail = (cityId) => router.push(`/weather/${cityId}`)

onMounted(loadSaved)
</script>

<template>
  <PageHeader
    :index="3"
    eyebrow="Saved"
    title="저장한 지역"
    desc="자주 확인하는 지역을 모아 두고 지금 상태를 한눈에 비교합니다."
  >
    <template #meta>
      <span class="eyebrow">{{ savedCities.length }}개 지역</span>
    </template>
  </PageHeader>

  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">저장 목록</h2>

      <div class="panel-tools">
        <button type="button" @click="configStore.toggleUnit()">
          단위 {{ configStore.unitSymbol }}
        </button>
        <button type="button" :disabled="isLoading || !savedCities.length" @click="loadSaved">
          {{ isLoading ? '불러오는 중…' : '새로고침' }}
        </button>
      </div>
    </div>

    <!-- 아직 아무것도 저장하지 않은 상태 -->
    <div v-if="savedCities.length === 0" class="empty">
      <p class="empty-title">저장한 지역이 없습니다</p>
      <p class="empty-desc">
        지역 상세 화면에서 <strong>저장</strong>을 누르면 이곳에 모입니다.
      </p>
      <button type="button" @click="router.push('/')">지역 둘러보기</button>
    </div>

    <template v-else>
      <LoadingPanel v-if="isLoading && !Object.keys(weatherById).length" message="지금 날씨를 확인하는 중" />
      <ErrorPanel v-else-if="errorMessage" :message="errorMessage" :busy="isLoading" @retry="loadSaved" />

      <IndexRow
        v-for="(city, position) in savedCities"
        v-else
        :key="city.id"
        :index="position + 1"
        :title="city.name"
        :subtitle="weatherById[city.id]?.status ?? '날씨 정보 없음'"
        :tags="
          weatherById[city.id]
            ? [
                `${toDisplayTemp(weatherById[city.id].temp)}${configStore.unitSymbol}`,
                `습도 ${weatherById[city.id].humidity}%`,
                position === 0 ? '기본 지역' : '',
              ].filter(Boolean)
            : []
        "
        clickable
        @select="goDetail(city.id)"
      >
        <template #actions>
          <button
            v-if="position !== 0"
            type="button"
            title="기본 지역으로 지정"
            @click="weatherStore.makeDefault(city.id)"
          >
            기본으로
          </button>
          <button type="button" @click="weatherStore.removeSaved(city.id)">삭제</button>
        </template>
      </IndexRow>

      <!-- 비교 결과 한 줄 요약 -->
      <p v-if="bestPick" class="verdict">
        지금은 <strong>{{ bestPick.city.name }}</strong>이(가) 가장 나가기 좋습니다 —
        {{ toDisplayTemp(bestPick.weather.temp) }}{{ configStore.unitSymbol }},
        {{ bestPick.weather.status }}
      </p>
    </template>
  </section>

  <!-- 저장한 장소 -->
  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">저장한 장소</h2>
      <RouterLink to="/spots" class="more">장소 더 보기 →</RouterLink>
    </div>

    <p v-if="savedSpots.length === 0" class="empty-line">
      <span class="empty-label">No saved place</span>
      명소 화면에서 <strong>저장</strong>을 누르면 이곳에 모입니다
    </p>

    <IndexRow
      v-for="(spot, position) in savedSpots"
      v-else
      :key="spot.id"
      :index="position + 1"
      :title="spot.name"
      :subtitle="spot.note"
      :tags="[spot.kind === 'indoor' ? '실내' : '실외', cityNameOf(spot.city) || spot.city]"
    >
      <template #actions>
        <button type="button" @click="weatherStore.toggleSpot(spot.id)">빼기</button>
      </template>
    </IndexRow>
  </section>

  <!-- 최근 본 지역 -->
  <section v-if="weatherStore.recentCities.length" class="panel recent">
    <div class="panel-head">
      <h2 class="panel-title">최근 본 지역</h2>
    </div>

    <div class="chip-row">
      <button
        v-for="city in weatherStore.recentCities"
        :key="city.id"
        type="button"
        class="chip"
        @click="goDetail(city.id)"
      >
        {{ city.name }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 24px 26px 8px;
  margin-bottom: 18px;
}

.panel.recent {
  padding-bottom: 24px;
}

.panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 18px;
}

.panel-title {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.panel-tools {
  display: flex;
  gap: 8px;
}

.panel-tools button {
  margin: 0;
}

.empty {
  padding: 34px 0 30px;
  border-top: 1px solid var(--border);
}

.empty-title {
  font-size: 1rem;
  font-weight: 700;
}

.empty-desc {
  margin: 8px 0 16px;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.verdict {
  padding: 18px 0 20px;
  font-size: 0.9rem;
  color: var(--text-meta);
}

.more {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.more:hover {
  color: var(--accent-text);
}

.empty-line {
  padding: 26px 0 30px;
  border-top: 1px solid var(--border);
  font-size: 0.9rem;
  color: var(--text-muted);
}

.empty-label {
  display: block;
  margin-bottom: 6px;
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 4px;
}

.chip {
  margin: 0;
  border-radius: 999px;
  text-transform: none;
  font-family: var(--font-body);
  font-size: 0.82rem;
  letter-spacing: 0;
}
</style>
