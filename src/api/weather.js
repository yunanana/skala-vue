import axios from 'axios'

import { CITIES, getMockForecast, getMockWeather } from '@/data/cities.js'

/**
 * 실시간 기상 조회
 *
 * 키가 필요 없는 공개 기상 API(Open-Meteo)를 쓴다.
 * 브라우저에서 바로 부를 수 있어 중계 서버가 필요 없고,
 * 배포 결과물에 비밀 값이 섞여 들어갈 일도 없다.
 *
 * 호출이 실패하면 화면이 비지 않도록 참고 데이터로 대신한다.
 */
const api = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 8000,
})

const CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation',
  'rain',
  'snowfall',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
].join(',')

/**
 * WMO 기상 코드를 우리 화면이 쓰는 형태로 옮긴다.
 * 두 번째 값은 화면 효과·추천 계산이 함께 쓰는 분류 번호다.
 * (2xx 뇌우 · 3xx 이슬비 · 5xx 비 · 6xx 눈 · 7xx 안개 · 800 맑음 · 80x 구름)
 */
const WMO = {
  0: ['맑음', 800],
  1: ['대체로 맑음', 801],
  2: ['구름 조금', 802],
  3: ['흐림', 804],
  45: ['안개', 741],
  48: ['서리 안개', 741],
  51: ['가랑비', 300],
  53: ['이슬비', 301],
  55: ['짙은 이슬비', 302],
  56: ['어는 가랑비', 310],
  57: ['어는 이슬비', 311],
  61: ['약한 비', 500],
  63: ['비', 501],
  65: ['강한 비', 502],
  66: ['어는 비', 511],
  67: ['강한 어는 비', 511],
  71: ['약한 눈', 600],
  73: ['눈', 601],
  75: ['많은 눈', 602],
  77: ['싸락눈', 611],
  80: ['소나기', 520],
  81: ['소나기', 521],
  82: ['강한 소나기', 522],
  85: ['소낙눈', 620],
  86: ['많은 소낙눈', 622],
  95: ['뇌우', 200],
  96: ['우박을 동반한 뇌우', 201],
  99: ['강한 뇌우', 202],
}

const describe = (code) => WMO[code] ?? ['정보 없음', 800]

/** km/h로 오는 풍속을 m/s로 바꾼다 */
const toMetersPerSecond = (kmh) => Math.round(((kmh ?? 0) / 3.6) * 10) / 10

/**
 * 지역 하나의 현재 날씨를 조회한다.
 * 응답을 화면이 쓰기 좋은 형태로 정리해서 돌려준다.
 */
export const fetchCityWeather = async (city) => {
  const { data } = await api.get('/forecast', {
    params: {
      latitude: city.lat,
      longitude: city.lon,
      current: CURRENT_FIELDS,
      daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'Asia/Seoul',
      forecast_days: 1,
    },
  })

  const now = data.current ?? {}
  const today = data.daily ?? {}
  const [status, weatherId] = describe(now.weather_code)

  return {
    id: city.id,
    name: city.name,
    province: city.province,
    lat: city.lat,
    lon: city.lon,
    temp: Math.round(now.temperature_2m ?? 0),
    feelsLike: Math.round(now.apparent_temperature ?? now.temperature_2m ?? 0),
    tempMin: Math.round(today.temperature_2m_min?.[0] ?? now.temperature_2m ?? 0),
    tempMax: Math.round(today.temperature_2m_max?.[0] ?? now.temperature_2m ?? 0),
    humidity: Math.round(now.relative_humidity_2m ?? 0),
    pressure: Math.round(now.pressure_msl ?? 0),
    windSpeed: toMetersPerSecond(now.wind_speed_10m),
    windDeg: Math.round(now.wind_direction_10m ?? 0),
    clouds: Math.round(now.cloud_cover ?? 0),
    // 이 API는 가시거리를 현재값으로 주지 않는다
    visibility: null,
    rain: now.rain ?? now.precipitation ?? 0,
    // 적설은 cm로 오므로 mm로 맞춘다
    snow: (now.snowfall ?? 0) * 10,
    sunrise: today.sunrise?.[0] ?? null,
    sunset: today.sunset?.[0] ?? null,
    status,
    weatherId,
  }
}

/**
 * 앞으로 24시간을 3시간 간격으로 추린 예보.
 */
export const fetchCityForecast = async (city, slots = 8) => {
  const { data } = await api.get('/forecast', {
    params: {
      latitude: city.lat,
      longitude: city.lon,
      hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code',
      timezone: 'Asia/Seoul',
      forecast_hours: slots * 3,
    },
  })

  const hourly = data.hourly ?? {}
  const times = hourly.time ?? []

  const picked = []
  for (let index = 0; index < times.length && picked.length < slots; index += 3) {
    const at = new Date(times[index])

    picked.push({
      at,
      time: at.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: at.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
      temp: Math.round(hourly.temperature_2m?.[index] ?? 0),
      pop: Math.round(hourly.precipitation_probability?.[index] ?? 0),
      rain: hourly.precipitation?.[index] ?? 0,
      status: describe(hourly.weather_code?.[index])[0],
    })
  }

  return picked
}

/**
 * 모든 지역의 날씨를 동시에 조회한다.
 * 일부가 실패해도 나머지는 그대로 쓰고, 실패한 곳은 참고 데이터로 채운다.
 */
export const fetchAllCitiesWeather = async (onProgress) => {
  let settled = 0

  // 한 곳이 끝날 때마다 알려 준다 (첫 화면의 진행률이 실제 값을 쓴다)
  const report = () => {
    settled += 1
    onProgress?.(settled, CITIES.length)
  }

  const results = await Promise.allSettled(
    CITIES.map((city) =>
      fetchCityWeather(city).then(
        (value) => {
          report()
          return value
        },
        (error) => {
          report()
          throw error
        },
      ),
    ),
  )

  const list = []
  const failed = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      list.push(result.value)
      return
    }

    failed.push(CITIES[index].name)

    // 참고 데이터라도 넣어 지도에 빈 지역이 생기지 않게 한다
    const fallback = getMockWeather(CITIES[index].id)
    if (fallback) list.push({ ...fallback, isFallback: true })
  })

  if (list.length === 0) {
    throw new Error('날씨 정보를 한 건도 받지 못했습니다.')
  }

  return { list, failed }
}

/** 조회가 실패했을 때 쓰는 참고 예보 */
export { getMockForecast as fetchFallbackForecast }
