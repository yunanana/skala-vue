/**
 * 지금 날씨에 맞는 장소를 고르는 계산
 *
 * 날씨 값(기온·강수·바람·구름)과 장소의 성질을 맞춰 0~100점을 매기고,
 * 왜 그 점수가 나왔는지 이유를 함께 돌려준다.
 * 날씨가 바뀌면 순위도 실제로 바뀐다.
 */

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)))

/** 비나 눈이 내리고 있는가 */
const isWet = (weather) => {
  const precipitation = (weather.rain ?? 0) + (weather.snow ?? 0)
  const group = Math.floor((weather.weatherId ?? 800) / 100)
  return precipitation > 0.1 || [2, 3, 5, 6].includes(group)
}

/**
 * 장소 하나의 점수와 이유
 * @returns {{score:number, reasons:string[]}}
 */
export const scoreSpot = (spot, weather) => {
  if (!weather) return { score: 0, reasons: [] }

  const reasons = []
  let score = 62

  const wet = isWet(weather)
  const temp = weather.temp
  const wind = weather.windSpeed ?? 0
  const clouds = weather.clouds ?? 0

  // 1) 비·눈 — 가장 크게 갈린다
  if (wet) {
    if (spot.kind === 'indoor') {
      score += 30
      reasons.push('비를 피할 수 있는 실내')
    } else if (spot.rainOk) {
      score += 12
      reasons.push('비가 와도 걸을 만한 구조')
    } else {
      score -= 34
      reasons.push('비에 그대로 노출되는 곳')
    }
  }

  // 2) 더위 — 그늘·물가·냉방이 있는 곳으로
  if (temp >= 28) {
    if (spot.heatEscape) {
      score += 20
      reasons.push('더위를 피하기 좋음')
    } else {
      score -= 16
      reasons.push('한낮 더위를 그대로 받는 곳')
    }
  }

  // 3) 추위 — 실내 쪽으로
  if (temp <= 5) {
    if (spot.kind === 'indoor') {
      score += 22
      reasons.push('추위를 피할 수 있는 실내')
    } else {
      score -= 18
      reasons.push('바깥에 오래 머물기 추운 날')
    }
  }

  // 4) 바람 — 전망대·해안은 불편해진다
  if (wind >= 7 && spot.windy) {
    score -= 20
    reasons.push('바람이 세서 불편할 수 있음')
  }

  // 5) 좋은 날 — 밖으로 나갈 이유가 된다
  const mild = temp >= 15 && temp <= 25
  if (!wet && mild && clouds < 60) {
    if (spot.kind === 'outdoor') {
      score += 22
      reasons.push('바깥에 있기 좋은 기온')
    } else {
      score -= 8
    }
  }

  // 6) 갈래별 성격 — 같은 조건에서도 어울리는 곳이 갈린다
  const byCategory = {
    hot: { water: 12, nature: 6, culture: 6, view: -6, market: -8, walk: -6 },
    mildClear: { view: 12, walk: 8, nature: 6, water: 4, market: 4, culture: -4 },
    wet: { culture: 8, market: 6, water: -6, view: -8, walk: -4, nature: -2 },
  }

  if (wet) score += byCategory.wet[spot.category] ?? 0
  else if (temp >= 28) score += byCategory.hot[spot.category] ?? 0
  else if (mild && clouds < 60) score += byCategory.mildClear[spot.category] ?? 0

  // 7) 맑고 시야가 트인 날의 전망대는 확실히 다르다
  if (!wet && spot.category === 'view' && clouds < 30 && (weather.visibility ?? 10000) >= 9000) {
    score += 10
    reasons.push('시야가 트여 멀리까지 보임')
  }

  return { score: clamp(score), reasons: reasons.slice(0, 2) }
}

/** 점수가 높은 순으로 정렬한 목록 */
export const rankSpots = (spots, weather) =>
  spots
    .map((spot) => ({ ...spot, ...scoreSpot(spot, weather) }))
    .sort((a, b) => b.score - a.score)

/**
 * 오늘의 결론 한 문장
 * 숫자를 나열하는 대신, 먼저 답을 준다.
 */
export const buildVerdict = (weather) => {
  if (!weather) return { headline: '', detail: '' }

  const wet = isWet(weather)
  const temp = weather.temp
  const wind = weather.windSpeed ?? 0

  if (wet) {
    return {
      headline: '오늘은 실내가 낫습니다',
      detail: '비를 피할 수 있는 곳부터 골랐습니다.',
    }
  }

  if (temp >= 30) {
    return {
      headline: '그늘과 물가를 찾으세요',
      detail: '한낮에는 바깥에 오래 서 있기 어려운 기온입니다.',
    }
  }

  if (temp <= 3) {
    return {
      headline: '실내 위주로 움직이세요',
      detail: '바깥에 머무는 시간을 짧게 잡는 편이 좋습니다.',
    }
  }

  if (wind >= 8) {
    return {
      headline: '높은 곳은 피하세요',
      detail: '바람이 강해 전망대나 해안은 불편할 수 있습니다.',
    }
  }

  if (temp >= 15 && temp <= 25) {
    return {
      headline: '걷기 좋은 날입니다',
      detail: '바깥에 오래 있어도 부담 없는 기온입니다.',
    }
  }

  return {
    headline: '무난하게 다닐 만합니다',
    detail: '실내와 실외 어느 쪽이든 괜찮은 날씨입니다.',
  }
}
