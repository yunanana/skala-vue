import { ref } from 'vue'

/**
 * 배경 디더링에 쓸 하늘색 팔레트.
 *
 * 컴포넌트 밖에 ref를 두면 어디서 import하든 같은 값을 공유한다.
 * (weatherFx.js의 fxMode와 같은 방식)
 */

// [어두운 쪽, 밝은 쪽] 두 색을 섞어 그라데이션 도트를 만든다
const PALETTES = {
  clearDay: { name: '맑은 낮', dark: [64, 132, 204], light: [196, 228, 252] },
  clearNight: { name: '맑은 밤', dark: [18, 26, 56], light: [78, 96, 152] },
  clouds: { name: '흐림', dark: [98, 116, 140], light: [200, 212, 226] },
  rain: { name: '비', dark: [42, 70, 102], light: [132, 160, 188] },
  snow: { name: '눈', dark: [146, 174, 198], light: [240, 248, 255] },
  storm: { name: '뇌우', dark: [42, 38, 68], light: [116, 110, 152] },
  mist: { name: '안개', dark: [122, 128, 132], light: [216, 220, 222] },
  // 날씨 정보가 없을 때 쓰는 기본값 (기존 흑백 배경과 동일)
  neutral: { name: '기본', dark: [70, 70, 70], light: [255, 255, 255] },
}

export const skyPalette = ref(PALETTES.neutral)

/**
 * OpenWeather의 날씨 코드와 낮/밤 여부로 팔레트를 고른다.
 * 2xx 뇌우 / 3xx 이슬비 / 5xx 비 / 6xx 눈 / 7xx 대기현상 / 800 맑음 / 80x 구름
 */
export const paletteFromWeather = (weatherId, isNight = false) => {
  if (weatherId == null) return PALETTES.neutral

  const group = Math.floor(weatherId / 100)

  if (group === 2) return PALETTES.storm
  if (group === 3 || group === 5) return PALETTES.rain
  if (group === 6) return PALETTES.snow
  if (group === 7) return PALETTES.mist
  // 800 맑음, 801 구름 조금까지는 '맑은 하늘'로 본다 (802부터 구름이 지배적)
  if (weatherId === 800 || weatherId === 801) {
    return isNight ? PALETTES.clearNight : PALETTES.clearDay
  }
  if (group === 8) return isNight ? PALETTES.clearNight : PALETTES.clouds

  return PALETTES.neutral
}

/** 일출·일몰 유닉스 시각으로 지금이 밤인지 판단한다 */
export const isNightNow = (sunrise, sunset) => {
  if (!sunrise || !sunset) return false
  const now = Date.now() / 1000
  return now < sunrise || now > sunset
}

/** 날씨 객체 하나를 받아 배경 팔레트를 갱신한다 */
export const applySkyFromWeather = (weather) => {
  if (!weather) {
    skyPalette.value = PALETTES.neutral
    return
  }
  skyPalette.value = paletteFromWeather(weather.weatherId, isNightNow(weather.sunrise, weather.sunset))
}
