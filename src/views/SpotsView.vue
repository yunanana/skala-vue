<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import PageHeader from '@/components/PageHeader.vue'
import SpotCard from '@/components/SpotCard.vue'
import LoadingPanel from '@/components/LoadingPanel.vue'
import ErrorPanel from '@/components/ErrorPanel.vue'
import { CITIES } from '@/data/cities.js'
import { CATEGORIES, SPOTS } from '@/data/spots.js'
import { fetchAllCitiesWeather } from '@/api/weather.js'
import { placeApi } from '@/api/placeApi.js'
import { rankSpots } from '@/utils/spotMatch.js'
import { useWeatherStore } from '@/stores/weatherStore.js'

const weatherStore = useWeatherStore()

const weatherList = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

// 내가 추가한 장소
const myPlaces = ref([])
const isPlaceLoading = ref(false)

// 화면에서 고르는 조건들
const cityFilter = ref('전체')
const kindFilter = ref('전체')
const categoryFilter = ref('전체')

/**
 * 날씨 가정 — 슬라이더를 움직이면 아래 목록이 그 자리에서 다시 정렬된다.
 * 값이 바뀌면 computed가 알아서 다시 계산하므로 새로고침이 필요 없다.
 */
const useWhatIf = ref(false)
const whatIf = reactive({ temp: 22, rain: 0, wind: 2 })

const categoryOptions = Object.entries(CATEGORIES).map(([key, value]) => ({
  key,
  label: value.label,
}))

const cityNameOf = (cityId) => CITIES.find((city) => city.id === cityId)?.name ?? ''

/** 지역 id로 그 지역의 현재 날씨를 찾는다 (가정 모드면 가정값을 쓴다) */
const weatherOf = (cityId) => {
  if (useWhatIf.value) {
    return {
      temp: whatIf.temp,
      feelsLike: whatIf.temp,
      rain: whatIf.rain,
      snow: 0,
      windSpeed: whatIf.wind,
      clouds: whatIf.rain > 0 ? 90 : 20,
      humidity: whatIf.rain > 0 ? 85 : 55,
      visibility: 10000,
      // 강수량이 있으면 비, 없으면 맑음으로 본다
      weatherId: whatIf.rain > 0 ? 500 : 800,
    }
  }

  return weatherList.value.find((item) => item.id === cityId) ?? null
}

/** 기본 명소 + 내가 추가한 장소 */
const allSpots = computed(() => [
  ...SPOTS,
  ...myPlaces.value.map((place) => ({ ...place, id: `mine-${place.id}`, placeId: place.id, mine: true })),
])

/**
 * 조건에 맞는 곳만 남기고, 각자의 지역 날씨로 점수를 매긴다.
 * 지역마다 날씨가 다르므로 장소별로 자기 지역 날씨를 쓴다.
 */
const visibleSpots = computed(() => {
  const filtered = allSpots.value.filter((spot) => {
    if (cityFilter.value !== '전체' && spot.city !== cityFilter.value) return false
    if (kindFilter.value !== '전체' && spot.kind !== kindFilter.value) return false
    if (categoryFilter.value !== '전체' && spot.category !== categoryFilter.value) return false
    return true
  })

  const byCity = {}
  filtered.forEach((spot) => {
    byCity[spot.city] = byCity[spot.city] ? [...byCity[spot.city], spot] : [spot]
  })

  return Object.entries(byCity)
    .flatMap(([cityId, spots]) => {
      const weather = weatherOf(cityId)
      if (!weather) return spots.map((spot) => ({ ...spot, score: 0, reasons: [] }))
      return rankSpots(spots, weather)
    })
    .sort((a, b) => b.score - a.score)
})

/** [담기]로 골라 둔 곳 — 브라우저에 저장되어 다시 방문해도 남아 있다 */
const pickedSpots = computed(() =>
  weatherStore.courseSpotIds
    .map((id) => visibleSpots.value.find((spot) => spot.id === id))
    .filter(Boolean),
)

/** 지금 조건에서 가장 점수가 높은 지역 */
const bestCityName = computed(() =>
  visibleSpots.value[0] ? cityNameOf(visibleSpots.value[0].city) : '',
)

const resetFilters = () => {
  cityFilter.value = '전체'
  kindFilter.value = '전체'
  categoryFilter.value = '전체'
}

const loadWeather = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { list } = await fetchAllCitiesWeather()
    weatherList.value = list
  } catch {
    errorMessage.value = '실시간 연결이 원활하지 않아 순위를 매길 수 없습니다.'
  } finally {
    isLoading.value = false
  }
}

/* ---------------- 내 장소 (등록·수정·삭제) ---------------- */
const dialogVisible = ref(false)
const editingId = ref(null)
const isSaving = ref(false)

const emptyForm = () => ({
  name: '',
  city: CITIES[0].id,
  category: 'walk',
  kind: 'outdoor',
  rainOk: false,
  heatEscape: false,
  windy: false,
  note: '',
})
const form = reactive(emptyForm())

const loadPlaces = async () => {
  isPlaceLoading.value = true
  try {
    myPlaces.value = await placeApi.getAll()
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    isPlaceLoading.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

const openEdit = (spot) => {
  editingId.value = spot.placeId
  Object.assign(form, {
    name: spot.name,
    city: spot.city,
    category: spot.category,
    kind: spot.kind,
    rainOk: spot.rainOk,
    heatEscape: spot.heatEscape,
    windy: spot.windy,
    note: spot.note ?? '',
  })
  dialogVisible.value = true
}

const submitPlace = async () => {
  if (form.name.trim().length < 2) {
    ElMessage.warning('장소 이름은 2글자 이상이어야 합니다.')
    return
  }

  isSaving.value = true
  try {
    if (editingId.value === null) {
      await placeApi.create({ ...form })
      ElMessage.success('장소를 추가했습니다.')
    } else {
      await placeApi.update(editingId.value, { ...form })
      ElMessage.success('장소를 수정했습니다.')
    }

    dialogVisible.value = false
    await loadPlaces()
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    isSaving.value = false
  }
}

const removePlace = async (spot) => {
  try {
    await ElMessageBox.confirm(`"${spot.name}"을(를) 지울까요?`, '장소 삭제', {
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      type: 'warning',
    })
  } catch {
    return // 사용자가 취소한 경우
  }

  try {
    await placeApi.remove(spot.placeId)
    ElMessage.success('장소를 지웠습니다.')
    await loadPlaces()
  } catch (err) {
    ElMessage.error(err.message)
  }
}

onMounted(() => {
  loadWeather()
  loadPlaces()
})
</script>

<template>
  <PageHeader
    :index="2"
    eyebrow="Spots"
    title="지금 갈 만한 곳"
    desc="전국의 가 볼 만한 곳을 각 지역의 지금 날씨로 줄 세웠습니다."
  >
    <template #meta>
      <span class="eyebrow">{{ visibleSpots.length }}곳</span>
    </template>
  </PageHeader>

  <!-- 조건 -->
  <section class="filters">
    <div class="filter">
      <label for="city">지역</label>
      <select id="city" v-model="cityFilter">
        <option value="전체">전체</option>
        <option v-for="city in CITIES" :key="city.id" :value="city.id">{{ city.name }}</option>
      </select>
    </div>

    <div class="filter">
      <label for="kind">실내 · 실외</label>
      <select id="kind" v-model="kindFilter">
        <option value="전체">전체</option>
        <option value="indoor">실내</option>
        <option value="outdoor">실외</option>
      </select>
    </div>

    <div class="filter">
      <label for="category">갈래</label>
      <select id="category" v-model="categoryFilter">
        <option value="전체">전체</option>
        <option v-for="option in categoryOptions" :key="option.key" :value="option.key">
          {{ option.label }}
        </option>
      </select>
    </div>

    <button type="button" @click="resetFilters">조건 지우기</button>
    <button type="button" class="primary" @click="openCreate">＋ 내 장소 추가</button>
  </section>

  <!-- 날씨를 바꿔 보면 순위가 즉시 다시 매겨진다 -->
  <section class="whatif" :class="{ on: useWhatIf }">
    <label class="whatif-switch">
      <input v-model="useWhatIf" type="checkbox" />
      <span>날씨를 바꿔 보기</span>
    </label>

    <template v-if="useWhatIf">
      <div class="slider">
        <label for="temp">기온 <b>{{ whatIf.temp }}°C</b></label>
        <input id="temp" v-model.number="whatIf.temp" type="range" min="-10" max="38" step="1" />
      </div>

      <div class="slider">
        <label for="rain">강수 <b>{{ whatIf.rain }}mm</b></label>
        <input id="rain" v-model.number="whatIf.rain" type="range" min="0" max="10" step="0.5" />
      </div>

      <div class="slider">
        <label for="wind">바람 <b>{{ whatIf.wind }}m/s</b></label>
        <input id="wind" v-model.number="whatIf.wind" type="range" min="0" max="14" step="1" />
      </div>
    </template>

    <p v-else class="whatif-hint">
      켜고 슬라이더를 움직이면 아래 순위가 그 자리에서 다시 매겨집니다.
    </p>
  </section>

  <!-- 담아 둔 곳 -->
  <details v-if="weatherStore.courseCount" class="picked" open>
    <summary>저장한 장소 {{ weatherStore.courseCount }}곳</summary>

    <p class="picked-hint">
      이 브라우저에 저장됩니다.
      <RouterLink to="/saved">저장 목록 보기 →</RouterLink>
    </p>

    <ul class="picked-list">
      <li v-for="spot in pickedSpots" :key="spot.id">
        <span class="picked-name">{{ spot.name }}</span>
        <span class="picked-city">{{ cityNameOf(spot.city) }}</span>
        <button type="button" @click="weatherStore.toggleSpot(spot.id)">빼기</button>
      </li>
    </ul>
  </details>

  <LoadingPanel v-if="isLoading && !weatherList.length" message="지역별 날씨를 확인하는 중입니다" :rows="8" />
  <ErrorPanel
    v-else-if="errorMessage"
    :message="errorMessage"
    :busy="isLoading"
    @retry="loadWeather"
  />

  <template v-else>
    <p v-if="bestCityName && cityFilter === '전체'" class="lead">
      <template v-if="useWhatIf">
        기온 {{ whatIf.temp }}°C · 강수 {{ whatIf.rain }}mm · 바람 {{ whatIf.wind }}m/s 라면
      </template>
      <template v-else>지금 조건에서는</template>
      <strong>{{ bestCityName }}</strong>이(가) 가장 잘 맞습니다.
    </p>

    <p v-if="visibleSpots.length === 0" class="empty">
      <span class="empty-label">No result</span>
      조건에 맞는 곳이 없습니다
    </p>

    <div v-else class="card-grid">
      <SpotCard
        v-for="(spot, position) in visibleSpots"
        :key="spot.id"
        v-reveal="Math.min(position, 11) * 60"
        :spot="spot"
        :rank="position + 1"
        :mine="Boolean(spot.mine)"
        :saved="weatherStore.isSpotSaved(spot.id)"
        @toggle-save="weatherStore.toggleSpot(spot.id)"
        @edit="openEdit"
        @remove="removePlace"
      />
    </div>
  </template>

  <!-- 내 장소 등록 / 수정 -->
  <el-dialog
    v-model="dialogVisible"
    :title="editingId === null ? '내 장소 추가' : '내 장소 수정'"
    width="520px"
  >
    <el-form :model="form" label-width="90px">
      <el-form-item label="이름">
        <el-input v-model.trim="form.name" maxlength="30" placeholder="예: 망원한강공원" />
      </el-form-item>

      <el-form-item label="지역">
        <el-select v-model="form.city" style="width: 100%">
          <el-option v-for="city in CITIES" :key="city.id" :label="city.name" :value="city.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="갈래">
        <el-select v-model="form.category" style="width: 100%">
          <el-option
            v-for="option in categoryOptions"
            :key="option.key"
            :label="option.label"
            :value="option.key"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="실내 · 실외">
        <el-radio-group v-model="form.kind">
          <el-radio value="outdoor">실외</el-radio>
          <el-radio value="indoor">실내</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="날씨 성질">
        <el-checkbox v-model="form.rainOk" label="비가 와도 괜찮음" />
        <el-checkbox v-model="form.heatEscape" label="더위를 피하기 좋음" />
        <el-checkbox v-model="form.windy" label="바람에 약함" />
      </el-form-item>

      <el-form-item label="한 줄 설명">
        <el-input v-model.trim="form.note" maxlength="60" placeholder="어떤 날 가면 좋은 곳인지" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">취소</el-button>
      <el-button type="primary" :loading="isSaving" @click="submitPlace">
        {{ editingId === null ? '추가' : '수정' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  padding: 18px 0 20px;
  border-bottom: 1px solid var(--border);
}

.filter {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter label {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.filter select {
  min-width: 118px;
}

.filters button {
  margin: 0;
}

.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
}

/* ---------------- 날씨 가정 ---------------- */
.whatif {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  padding: 14px 0 18px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.whatif.on {
  border-bottom-color: var(--accent);
}

.whatif-switch {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  cursor: pointer;
}

.whatif-hint {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.slider {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 170px;
}

.slider label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-muted);
}

.slider b {
  color: var(--text);
}

.slider input[type='range'] {
  accent-color: var(--accent);
  padding: 0;
  border: 0;
}

/* ---------------- 담아 둔 곳 ---------------- */
.picked {
  padding: 14px 16px;
  border: 1px solid var(--accent);
  background: var(--accent-soft);
  margin-bottom: 20px;
}

.picked summary {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  cursor: pointer;
}

.picked-hint {
  margin-top: 10px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.picked-hint a {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  margin-left: 6px;
}

.picked-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.picked-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px 5px 11px;
  border: 1px solid var(--border);
  background: var(--bg);
}

.picked-name {
  font-weight: 600;
  font-size: 0.86rem;
}

.picked-city {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  color: var(--text-muted);
}

.picked-list button {
  margin: 0;
  padding: 3px 8px;
  font-size: 0.6rem;
}

.lead {
  margin-bottom: 18px;
  font-size: 0.95rem;
  color: var(--text-meta);
}

.empty {
  padding: 44px 0;
  text-align: center;
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

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}
</style>
