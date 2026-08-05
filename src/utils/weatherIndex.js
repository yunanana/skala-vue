/**
 * OpenWeather의 원시 관측값에서 "생활지수"를 파생 계산한다.
 *
 * API가 직접 주지 않는 값이라, 습도·구름·강수량·바람 같은 지표를 조합해
 * 0~100 점수로 환산한다. 기준은 체감에 맞춰 정한 값이다.
 */

/** 값을 0~100 사이로 자른다 */
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)))

/** 점수를 3단계 라벨로 바꾼다 */
const toLevel = (score) => {
  if (score >= 67) return '높음'
  if (score >= 34) return '보통'
  return '낮음'
}

/**
 * 우산지수 — 높을수록 우산이 필요하다.
 * 실제 강수량을 가장 크게 보고, 날씨 코드와 습도로 보정한다.
 */
const umbrellaScore = (w) => {
  const precipitation = (w.rain ?? 0) + (w.snow ?? 0)
  const group = Math.floor((w.weatherId ?? 800) / 100)

  // 강수량 1mm만 넘어도 우산이 필요하므로 가중치를 크게 준다
  let score = Math.min(precipitation * 45, 70)

  // 2xx 뇌우 / 3xx 이슬비 / 5xx 비 / 6xx 눈이면 코드만으로 가산
  if (group === 2) score += 30
  else if (group === 3) score += 18
  else if (group === 5) score += 25
  else if (group === 6) score += 25

  // 습도가 아주 높으면 곧 내릴 가능성을 조금 반영
  if (w.humidity >= 85) score += 10
  else if (w.humidity >= 75) score += 5

  return clamp(score)
}

/**
 * 빨래지수 — 높을수록 잘 마른다.
 * 습도가 낮고 구름이 적으며 바람이 적당할 때 가장 높다.
 */
const laundryScore = (w) => {
  const precipitation = (w.rain ?? 0) + (w.snow ?? 0)

  // 비가 오면 널 수 없으므로 즉시 0점 처리
  if (precipitation > 0.1) return 0

  // 습도가 낮을수록 유리 (30% -> 만점, 90% -> 0점)
  let score = ((90 - w.humidity) / 60) * 70

  // 구름이 적을수록 일사량이 좋다
  score += ((100 - (w.clouds ?? 0)) / 100) * 20

  // 바람은 2~6m/s가 가장 잘 마른다
  const wind = w.windSpeed ?? 0
  if (wind >= 2 && wind <= 6) score += 10
  else if (wind > 6) score += 4

  return clamp(score)
}

/**
 * 야외활동지수 — 높을수록 나가기 좋다.
 * 18~24°C를 기준으로 멀어질수록, 비바람이 셀수록 깎는다.
 */
const outdoorScore = (w) => {
  const precipitation = (w.rain ?? 0) + (w.snow ?? 0)

  // 쾌적 구간에서 얼마나 벗어났는지 (°C)
  const comfortGap = w.temp < 18 ? 18 - w.temp : w.temp > 24 ? w.temp - 24 : 0

  let score = 100 - comfortGap * 4.5
  score -= Math.min(precipitation * 30, 45) // 비가 오면 크게 감점
  score -= Math.max(0, (w.windSpeed ?? 0) - 5) * 5 // 5m/s 넘는 바람부터 감점
  score -= ((w.clouds ?? 0) / 100) * 8 // 흐림은 소폭 감점

  return clamp(score)
}

/**
 * 도시 하나의 날씨 객체에서 지수 4종을 계산한다.
 * 체감차는 점수가 아니라 실제 온도차(°C)를 그대로 쓴다.
 */
export const buildWeatherIndices = (weather) => {
  if (!weather) return []

  const umbrella = umbrellaScore(weather)
  const laundry = laundryScore(weather)
  const outdoor = outdoorScore(weather)
  const feelsGap = Math.round((weather.feelsLike ?? weather.temp) - weather.temp)

  return [
    {
      key: 'umbrella',
      label: '우산지수',
      score: umbrella,
      level: toLevel(umbrella),
      hint: umbrella >= 67 ? '우산을 챙기세요' : umbrella >= 34 ? '접이식 우산 정도' : '우산 없이도 괜찮아요',
    },
    {
      key: 'laundry',
      label: '빨래지수',
      score: laundry,
      level: toLevel(laundry),
      hint: laundry >= 67 ? '오늘 빨래하기 좋아요' : laundry >= 34 ? '실내 건조를 권해요' : '빨래는 미루세요',
    },
    {
      key: 'outdoor',
      label: '야외활동지수',
      score: outdoor,
      level: toLevel(outdoor),
      hint: outdoor >= 67 ? '나들이하기 좋아요' : outdoor >= 34 ? '가볍게 산책 정도' : '실내가 낫겠어요',
    },
    {
      key: 'feels',
      label: '체감차',
      // 막대는 절대값 기준으로 표시하되 최대 10°C를 100%로 본다
      score: clamp(Math.abs(feelsGap) * 10),
      level: `${feelsGap > 0 ? '+' : ''}${feelsGap}°C`,
      hint: feelsGap > 2 ? '실제보다 덥게 느껴져요' : feelsGap < -2 ? '실제보다 춥게 느껴져요' : '체감과 실제가 비슷해요',
    },
  ]
}
