<script setup>
import { computed, onMounted, ref } from 'vue'

import BaseDashboardCard from '@/components/weather/BaseDashboardCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { CITIES, getMockWeather } from '@/data/cities.js'
import { fetchCityWeather } from '@/api/weather.js'
import { postApi } from '@/api/postApi.js'
import { buildWeatherIndices } from '@/utils/weatherIndex.js'
import { applySkyFromWeather } from '@/utils/skyTheme.js'
import { useAuthStore } from '@/stores/auth.js'
import { useConfigStore } from '@/stores/configStore.js'

const authStore = useAuthStore()
const configStore = useConfigStore()

// 기록에 붙일 제목 접두사. 목록을 이 값으로 검색해 날씨 기록만 골라낸다.
const LOG_TAG = '날씨 기록 ·'

const selectedCityId = ref(CITIES[0].id)
const weather = ref(null)
const isLoading = ref(false)
const isSaving = ref(false)
const usedFallback = ref(false)

const logs = ref([])
const isLogLoading = ref(false)

const statusMessage = ref('지역을 고르고 지금을 기록해 보세요.')
const errorMessage = ref('')

const selectedCity = computed(() => CITIES.find((c) => c.id === selectedCityId.value))

// 원시 관측값에서 파생한 생활지수 (API가 주지 않는 값)
const indices = computed(() => buildWeatherIndices(weather.value))

// 스토어의 단위 설정에 맞춰 표시값만 바꾼다 (원본은 항상 섭씨)
const displayTemp = computed(() => {
  if (!weather.value) return null
  return configStore.unit === 'fahrenheit'
    ? Math.round((weather.value.temp * 9) / 5 + 32)
    : weather.value.temp
})

/** 선택한 도시의 실시간 날씨를 불러온다 */
const loadWeather = async () => {
  isLoading.value = true
  errorMessage.value = ''
  usedFallback.value = false

  try {
    weather.value = await fetchCityWeather(selectedCity.value)
    // 배경 도트 색을 이 지역 날씨에 맞춘다
    applySkyFromWeather(weather.value)
  } catch {
    // 호출이 실패해도 화면이 비지 않도록 참고 데이터로 대신한다
    weather.value = getMockWeather(selectedCityId.value)
    usedFallback.value = true
    errorMessage.value = '실시간 연결이 원활하지 않아 최근 기준값을 표시합니다.'
  } finally {
    isLoading.value = false
  }
}

/** 지금까지 남긴 관측 기록만 골라 불러온다 */
const loadLogs = async () => {
  isLogLoading.value = true
  try {
    logs.value = await postApi.getAll({ q: LOG_TAG })
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLogLoading.value = false
  }
}

/**
 * 지금 화면의 관측값과 지수를 한 편의 게시글로 만들어 저장한다.
 * 게시글 API는 title/content/author만 받으므로 본문에 지표를 정리해 넣는다.
 */
const saveLog = async () => {
  if (!weather.value) return

  isSaving.value = true
  errorMessage.value = ''

  const w = weather.value
  const recordedAt = new Date().toLocaleString('ko-KR')

  const indexLines = indices.value.map((i) => `- ${i.label}: ${i.level} (${i.score}점) — ${i.hint}`).join('\n')

  const content = [
    `기록 시각: ${recordedAt}`,
    `기온 ${w.temp}°C (체감 ${w.feelsLike}°C) / ${w.status}`,
    `습도 ${w.humidity}% · 바람 ${w.windSpeed}m/s · 구름 ${w.clouds}%`,
    `강수 ${(w.rain ?? 0) + (w.snow ?? 0)}mm · 기압 ${w.pressure}hPa`,
    '',
    '[생활지수]',
    indexLines,
    usedFallback.value ? '\n※ 참고 데이터 기준 기록입니다.' : '',
  ]
    .join('\n')
    .trim()

  try {
    await postApi.create({
      title: `${LOG_TAG} ${w.name} ${w.temp}°C ${w.status}`,
      content,
      // 로그인했다면 실제 이름으로, 아니면 익명 기록으로 남는다
      author: authStore.isLoggedIn ? authStore.user.name : '날씨봇',
    })

    statusMessage.value = `${w.name}의 현재 날씨를 기록했습니다.`
    await loadLogs()
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isSaving.value = false
  }
}

/** 관측 기록 삭제 */
const removeLog = async (log) => {
  if (!window.confirm(`"${log.title}" 기록을 삭제할까요?`)) return

  try {
    await postApi.remove(log.id)
    statusMessage.value = '기록을 삭제했습니다.'
    await loadLogs()
  } catch (err) {
    errorMessage.value = err.message
  }
}

const formatDate = (text) =>
  new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(text))

onMounted(async () => {
  await loadWeather()
  await loadLogs()
})
</script>

<template>
  <PageHeader
    :index="2"
    eyebrow="Guide"
    title="오늘의 가이드"
    desc="지금 날씨로 우산·빨래·외출을 판단하고, 그 순간을 기록으로 남깁니다."
  >
    <template #meta>
      <span class="eyebrow">{{ configStore.unitSymbol }}</span>
    </template>
  </PageHeader>

  <div class="dashboard-wrapper">
    <!-- 관측 대상 선택 -->
    <BaseDashboardCard>
      <div class="box-head">
        <h3>지역 선택</h3>
        <div class="box-actions">
          <button :disabled="isLoading" @click="loadWeather">
            {{ isLoading ? '불러오는 중…' : '새로고침' }}
          </button>
        </div>
      </div>

      <div class="filter-row">
        <select v-model="selectedCityId" @change="loadWeather">
          <option v-for="city in CITIES" :key="city.id" :value="city.id">{{ city.name }}</option>
        </select>

        <button class="primary" :disabled="isSaving || !weather" @click="saveLog">
          {{ isSaving ? '기록 중…' : '이 순간 기록하기' }}
        </button>

        <span v-if="usedFallback" class="stamp">참고 데이터</span>
      </div>

      <p v-if="errorMessage" class="state-msg error">{{ errorMessage }}</p>
    </BaseDashboardCard>

    <!-- 현재 관측값 -->
    <BaseDashboardCard>
      <div class="box-head">
        <h3>지금 상태</h3>
      </div>

      <p v-if="isLoading" class="state-msg">날씨를 불러오는 중입니다…</p>

      <template v-else-if="weather">
        <div class="reading-head">
          <strong class="reading-temp">{{ displayTemp }}{{ configStore.unitSymbol }}</strong>
          <span class="reading-status">{{ weather.status }}</span>
        </div>

        <dl class="metric-grid">
          <div><dt>체감</dt><dd>{{ weather.feelsLike }}°C</dd></div>
          <div><dt>습도</dt><dd>{{ weather.humidity }}%</dd></div>
          <div><dt>바람</dt><dd>{{ weather.windSpeed }}m/s</dd></div>
          <div><dt>구름</dt><dd>{{ weather.clouds }}%</dd></div>
          <div><dt>강수</dt><dd>{{ (weather.rain ?? 0) + (weather.snow ?? 0) }}mm</dd></div>
          <div><dt>기압</dt><dd>{{ weather.pressure }}hPa</dd></div>
        </dl>
      </template>
    </BaseDashboardCard>

    <!-- 파생 생활지수 -->
    <BaseDashboardCard v-if="weather">
      <div class="box-head">
        <h3>오늘의 판단</h3>
        <span class="stamp">지금 값에서 계산</span>
      </div>

      <div v-for="index in indices" :key="index.key" class="index-row">
        <div class="index-label">
          <span>{{ index.label }}</span>
          <strong>{{ index.level }}</strong>
        </div>
        <div class="meter"><span class="meter-fill" :style="{ width: `${index.score}%` }"></span></div>
        <p class="index-hint">{{ index.hint }}</p>
      </div>
    </BaseDashboardCard>

    <!-- 기록 목록 -->
    <BaseDashboardCard>
      <div class="box-head">
        <h3>지난 기록</h3>
        <span class="stamp">{{ logs.length }}건</span>
      </div>

      <p v-if="isLogLoading" class="state-msg">기록을 불러오는 중입니다…</p>
      <p v-else-if="logs.length === 0" class="empty-result">아직 남긴 기록이 없습니다.</p>

      <template v-else>
        <article v-for="log in logs" :key="log.id" class="log-card">
          <div class="log-meta">
            <span>#{{ log.id }}</span>
            <span>{{ log.author }}</span>
            <time :datetime="log.createdAt">{{ formatDate(log.createdAt) }}</time>
          </div>

          <h4>{{ log.title }}</h4>
          <pre class="log-body">{{ log.content }}</pre>

          <div class="card-actions">
            <button @click="removeLog(log)">삭제</button>
          </div>
        </article>
      </template>
    </BaseDashboardCard>

    <div class="status-bar">{{ statusMessage }}</div>
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
}

.box-head button {
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

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-row button {
  margin: 0;
}

.primary {
  border-color: var(--text);
  background: var(--text);
  color: var(--bg);
}

.primary:not(:disabled):hover {
  background: var(--text);
  border-color: var(--text);
  opacity: 0.85;
}

/* ---------------- 관측값 ---------------- */
.reading-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
}

.reading-temp {
  font-family: var(--font-mono);
  font-size: 2.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.reading-status {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
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
  font-family: var(--font-mono);
  font-size: 0.92rem;
  font-weight: 600;
}

/* ---------------- 생활지수 ---------------- */
.index-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.index-row:last-child {
  border-bottom: none;
}

.index-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.index-label strong {
  font-family: var(--font-mono);
  font-size: 0.82rem;
}

/* 색 대신 채움 길이로만 크기를 표현한다 (무채색 원칙) */
.meter {
  height: 6px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
}

.meter-fill {
  display: block;
  height: 100%;
  background: var(--text);
  transition: width 0.3s ease;
}

.index-hint {
  margin-top: 6px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* ---------------- 기록 카드 ---------------- */
.log-card {
  border: 1px solid var(--border);
  background: var(--bg);
  padding: 15px 17px;
  margin-bottom: -1px;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.log-card:hover {
  border-color: var(--hover-border);
  background: var(--bg-hover);
  position: relative;
  z-index: 1;
}

.log-meta {
  display: flex;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
}

.log-card h4 {
  margin: 6px 0 8px;
  font-size: 0.95rem;
}

.log-body {
  margin: 0 0 12px;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  line-height: 1.7;
  color: var(--text-meta);
  white-space: pre-wrap;
  word-break: break-all;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}

.card-actions button {
  margin: 0;
  font-size: 0.75rem;
  padding: 4px 10px;
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
  margin-top: 10px;
}
</style>
