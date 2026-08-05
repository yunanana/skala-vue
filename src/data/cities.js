/**
 * 관측 지점 목록 (시도별 1곳)
 *
 * 지도를 시도 단위로 칠하기 때문에, 각 시도를 대표하는 지점 하나씩을 둔다.
 * province 값은 src/data/koreaProvinces.js의 name과 정확히 같아야 도형과 연결된다.
 * lat/lon은 OpenWeather 조회에 그대로 쓰인다.
 */
export const CITIES = [
  { id: 'seoul', name: '서울', province: '서울특별시', lat: 37.5665, lon: 126.978 },
  { id: 'incheon', name: '인천', province: '인천광역시', lat: 37.4563, lon: 126.7052 },
  { id: 'gyeonggi', name: '경기', province: '경기도', lat: 37.2636, lon: 127.0286 },
  { id: 'gangwon', name: '강원', province: '강원도', lat: 37.8813, lon: 127.73 },
  { id: 'chungbuk', name: '충북', province: '충청북도', lat: 36.6424, lon: 127.489 },
  { id: 'chungnam', name: '충남', province: '충청남도', lat: 36.6009, lon: 126.665 },
  { id: 'sejong', name: '세종', province: '세종특별자치시', lat: 36.4801, lon: 127.289 },
  { id: 'daejeon', name: '대전', province: '대전광역시', lat: 36.3504, lon: 127.3845 },
  { id: 'jeonbuk', name: '전북', province: '전라북도', lat: 35.8242, lon: 127.148 },
  { id: 'jeonnam', name: '전남', province: '전라남도', lat: 34.99, lon: 126.46 },
  { id: 'gwangju', name: '광주', province: '광주광역시', lat: 35.1595, lon: 126.8526 },
  { id: 'gyeongbuk', name: '경북', province: '경상북도', lat: 36.5684, lon: 128.7294 },
  { id: 'daegu', name: '대구', province: '대구광역시', lat: 35.8714, lon: 128.6014 },
  { id: 'gyeongnam', name: '경남', province: '경상남도', lat: 35.228, lon: 128.6811 },
  { id: 'ulsan', name: '울산', province: '울산광역시', lat: 35.5384, lon: 129.3114 },
  { id: 'busan', name: '부산', province: '부산광역시', lat: 35.1796, lon: 129.0756 },
  { id: 'jeju', name: '제주', province: '제주특별자치도', lat: 33.4996, lon: 126.5312 },
]

/**
 * 지역별 Mock 기상관측 데이터 (임시 데이터)
 * API 호출이 실패하거나 키가 없을 때 화면이 비지 않도록 폴백으로 사용한다.
 */
export const MOCK_WEATHER = {
  seoul: { temp: 28, feelsLike: 30, tempMin: 24, tempMax: 31, humidity: 60, pressure: 1008, windSpeed: 2.1, windDeg: 270, clouds: 20, visibility: 10000, rain: 0, snow: 0, status: '맑음', weatherId: 800 },
  incheon: { temp: 26, feelsLike: 28, tempMin: 22, tempMax: 29, humidity: 70, pressure: 1010, windSpeed: 3.4, windDeg: 290, clouds: 75, visibility: 9000, rain: 0.4, snow: 0, status: '실비', weatherId: 500 },
  gyeonggi: { temp: 27, feelsLike: 29, tempMin: 23, tempMax: 30, humidity: 65, pressure: 1009, windSpeed: 1.8, windDeg: 250, clouds: 40, visibility: 10000, rain: 0, snow: 0, status: '구름조금', weatherId: 801 },
  gangwon: { temp: 24, feelsLike: 25, tempMin: 20, tempMax: 27, humidity: 68, pressure: 1011, windSpeed: 2.6, windDeg: 60, clouds: 60, visibility: 10000, rain: 0, snow: 0, status: '구름많음', weatherId: 803 },
  chungbuk: { temp: 26, feelsLike: 28, tempMin: 22, tempMax: 30, humidity: 64, pressure: 1009, windSpeed: 1.6, windDeg: 210, clouds: 45, visibility: 10000, rain: 0, snow: 0, status: '구름조금', weatherId: 801 },
  chungnam: { temp: 25, feelsLike: 27, tempMin: 21, tempMax: 29, humidity: 72, pressure: 1010, windSpeed: 2.9, windDeg: 280, clouds: 70, visibility: 9000, rain: 0.2, snow: 0, status: '실비', weatherId: 500 },
  sejong: { temp: 26, feelsLike: 28, tempMin: 22, tempMax: 30, humidity: 66, pressure: 1009, windSpeed: 1.7, windDeg: 230, clouds: 50, visibility: 10000, rain: 0, snow: 0, status: '튼구름', weatherId: 802 },
  daejeon: { temp: 27, feelsLike: 29, tempMin: 23, tempMax: 30, humidity: 62, pressure: 1009, windSpeed: 1.5, windDeg: 200, clouds: 30, visibility: 10000, rain: 0, snow: 0, status: '맑음', weatherId: 800 },
  jeonbuk: { temp: 27, feelsLike: 29, tempMin: 23, tempMax: 31, humidity: 67, pressure: 1009, windSpeed: 2.0, windDeg: 240, clouds: 55, visibility: 10000, rain: 0, snow: 0, status: '튼구름', weatherId: 802 },
  jeonnam: { temp: 28, feelsLike: 31, tempMin: 24, tempMax: 32, humidity: 74, pressure: 1008, windSpeed: 3.2, windDeg: 190, clouds: 65, visibility: 9000, rain: 0.6, snow: 0, status: '실비', weatherId: 500 },
  gwangju: { temp: 28, feelsLike: 30, tempMin: 24, tempMax: 31, humidity: 63, pressure: 1008, windSpeed: 2.2, windDeg: 220, clouds: 50, visibility: 10000, rain: 0, snow: 0, status: '튼구름', weatherId: 802 },
  gyeongbuk: { temp: 27, feelsLike: 29, tempMin: 22, tempMax: 31, humidity: 58, pressure: 1008, windSpeed: 2.4, windDeg: 140, clouds: 25, visibility: 10000, rain: 0, snow: 0, status: '맑음', weatherId: 800 },
  daegu: { temp: 29, feelsLike: 32, tempMin: 25, tempMax: 33, humidity: 55, pressure: 1007, windSpeed: 2.0, windDeg: 180, clouds: 10, visibility: 10000, rain: 0, snow: 0, status: '맑음', weatherId: 800 },
  gyeongnam: { temp: 27, feelsLike: 30, tempMin: 23, tempMax: 30, humidity: 71, pressure: 1009, windSpeed: 2.8, windDeg: 160, clouds: 60, visibility: 10000, rain: 0, snow: 0, status: '구름많음', weatherId: 803 },
  ulsan: { temp: 26, feelsLike: 28, tempMin: 22, tempMax: 29, humidity: 72, pressure: 1010, windSpeed: 3.0, windDeg: 150, clouds: 80, visibility: 9000, rain: 0, snow: 0, status: '온흐림', weatherId: 804 },
  busan: { temp: 26, feelsLike: 28, tempMin: 23, tempMax: 28, humidity: 75, pressure: 1010, windSpeed: 4.1, windDeg: 130, clouds: 85, visibility: 8000, rain: 1.2, snow: 0, status: '비', weatherId: 501 },
  jeju: { temp: 27, feelsLike: 30, tempMin: 24, tempMax: 29, humidity: 78, pressure: 1009, windSpeed: 5.2, windDeg: 170, clouds: 40, visibility: 10000, rain: 0, snow: 0, status: '구름조금', weatherId: 801 },
}

/** 지역 코드로 Mock 상세 데이터를 만들어 반환한다 */
export const getMockWeather = (cityId) => {
  const city = CITIES.find((c) => c.id === cityId)
  const mock = MOCK_WEATHER[cityId]
  if (!city || !mock) return null
  return { ...city, ...mock, sunrise: null, sunset: null, icon: '01d' }
}

/**
 * Mock 단기 예보 (3시간 간격)
 * 키 없이 배포했을 때도 상세 화면의 예보 칸이 비지 않도록,
 * 현재 기온을 기준으로 하루 주기의 오르내림을 만들어 채운다.
 * 실제 API 응답(fetchCityForecast)과 같은 필드 구성을 유지한다.
 */
export const getMockForecast = (cityId, slots = 8) => {
  const mock = MOCK_WEATHER[cityId]
  if (!mock) return []

  const startedAt = Date.now()
  const halfSwing = (mock.tempMax - mock.tempMin) / 2

  return Array.from({ length: slots }, (_, index) => {
    const at = new Date(startedAt + (index + 1) * 3 * 60 * 60 * 1000)

    // 새벽에 가장 낮고 오후에 가장 높아지도록 사인 곡선을 태운다
    const swing = Math.sin(((at.getHours() - 9) / 24) * 2 * Math.PI)

    return {
      at,
      time: at.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: at.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
      temp: Math.round(mock.temp + swing * halfSwing),
      // 구름이 많고 비가 오는 지역일수록 강수확률을 높게 잡는다
      pop: Math.min(100, Math.round(mock.clouds * 0.6 + (mock.rain > 0 ? 40 : 0))),
      rain: mock.rain,
      status: mock.status,
    }
  })
}
