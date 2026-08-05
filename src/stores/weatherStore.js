import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { CITIES } from '@/data/cities.js'

const savedStorageKey = 'between-weather-saved'
const recentStorageKey = 'between-weather-recent'
const spotStorageKey = 'between-weather-course'

const readList = (key) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

/**
 * 사용자가 고른 지역과 지금 보고 있는 날씨를 담는 저장소
 *
 * - 저장한 지역과 최근 본 지역은 브라우저에 남겨 다시 방문해도 유지된다.
 * - 화면 곳곳(상단 바, 저장 목록, 가이드)이 같은 값을 보게 하려고 한곳에 모았다.
 */
export const useWeatherStore = defineStore('weather', () => {
  // 저장한 지역 id 목록 (순서 = 사용자가 추가한 순서)
  const savedIds = ref(readList(savedStorageKey))
  // 최근 본 지역 id (최신순, 최대 5개)
  const recentIds = ref(readList(recentStorageKey))

  // 오늘 코스에 담아 둔 장소 id 목록
  const courseSpotIds = ref(readList(spotStorageKey))

  // 지금 화면에서 보고 있는 지역의 날씨 요약 (상단 바가 이 값을 쓴다)
  const current = ref(null)

  // 브라우저에 그대로 남긴다
  watch(savedIds, (list) => localStorage.setItem(savedStorageKey, JSON.stringify(list)), {
    deep: true,
  })
  watch(recentIds, (list) => localStorage.setItem(recentStorageKey, JSON.stringify(list)), {
    deep: true,
  })
  watch(courseSpotIds, (list) => localStorage.setItem(spotStorageKey, JSON.stringify(list)), {
    deep: true,
  })

  /** 저장한 지역의 전체 정보 (id만 저장하고 나머지는 여기서 채운다) */
  const savedCities = computed(() =>
    savedIds.value.map((id) => CITIES.find((city) => city.id === id)).filter(Boolean),
  )

  const recentCities = computed(() =>
    recentIds.value.map((id) => CITIES.find((city) => city.id === id)).filter(Boolean),
  )

  /** 저장 목록의 첫 번째 지역을 기본 지역으로 본다 */
  const defaultCity = computed(() => savedCities.value[0] ?? null)

  const isSaved = (cityId) => savedIds.value.includes(cityId)

  function toggleSaved(cityId) {
    if (isSaved(cityId)) savedIds.value = savedIds.value.filter((id) => id !== cityId)
    else savedIds.value = [...savedIds.value, cityId]
  }

  function removeSaved(cityId) {
    savedIds.value = savedIds.value.filter((id) => id !== cityId)
  }

  /** 저장 목록에서 순서를 올려 기본 지역으로 만든다 */
  function makeDefault(cityId) {
    if (!isSaved(cityId)) return
    savedIds.value = [cityId, ...savedIds.value.filter((id) => id !== cityId)]
  }

  /** 지역을 볼 때마다 호출 — 최근 목록 갱신 + 상단 바 요약 저장 */
  function markViewed(weather) {
    if (!weather) return

    current.value = {
      id: weather.id,
      name: weather.name,
      temp: weather.temp,
      status: weather.status,
    }

    recentIds.value = [weather.id, ...recentIds.value.filter((id) => id !== weather.id)].slice(0, 5)
  }

  /* ---------------- 오늘 코스에 담은 장소 ---------------- */
  const isSpotSaved = (spotId) => courseSpotIds.value.includes(spotId)

  function toggleSpot(spotId) {
    if (isSpotSaved(spotId)) courseSpotIds.value = courseSpotIds.value.filter((id) => id !== spotId)
    else courseSpotIds.value = [...courseSpotIds.value, spotId]
  }

  const courseCount = computed(() => courseSpotIds.value.length)

  return {
    savedIds,
    recentIds,
    courseSpotIds,
    courseCount,
    isSpotSaved,
    toggleSpot,
    current,
    savedCities,
    recentCities,
    defaultCity,
    isSaved,
    toggleSaved,
    removeSaved,
    makeDefault,
    markViewed,
  }
})
