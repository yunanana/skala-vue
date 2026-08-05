/**
 * 지역별 가 볼 만한 곳
 *
 * 날씨에 따라 순위가 바뀌어야 하므로, 각 장소에 "어떤 날씨에 강한가"를 함께 적어 둔다.
 * - kind      : indoor(실내) / outdoor(실외)
 * - category  : 화면에서 색과 무늬로 구분하는 갈래
 * - rainOk    : 비가 와도 지장이 적은 곳 (지붕·회랑·실내 동선)
 * - heatEscape: 더울 때 피하기 좋은 곳 (그늘·물가·냉방)
 * - windy     : 바람이 세면 불편한 곳 (전망대·해안 절벽)
 *
 * city 값은 src/data/cities.js의 id와 같아야 그 지역 날씨와 연결된다.
 */
export const CATEGORIES = {
  culture: { label: '문화·전시', tint: 'violet' },
  water: { label: '물가', tint: 'cyan' },
  walk: { label: '산책', tint: 'green' },
  view: { label: '전망', tint: 'blue' },
  market: { label: '시장·거리', tint: 'orange' },
  nature: { label: '자연', tint: 'lime' },
}

export const SPOTS = [
  // 서울
  { id: 'seoul-1', city: 'seoul', name: '국립중앙박물관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '하루를 통째로 쓸 수 있는 실내 전시' },
  { id: 'seoul-2', city: 'seoul', name: '서울숲', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: true, windy: false, note: '나무 그늘이 넉넉한 도심 숲' },
  { id: 'seoul-3', city: 'seoul', name: '청계천', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: false, note: '물길을 따라 걷는 도심 산책로' },
  { id: 'seoul-4', city: 'seoul', name: '남산서울타워', category: 'view', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '맑은 날 시야가 가장 멀리 트인다' },

  // 인천
  { id: 'incheon-1', city: 'incheon', name: '국립세계문자박물관', wiki: '송도국제도시', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '송도 한복판의 실내 전시관' },
  { id: 'incheon-2', city: 'incheon', name: '송도 센트럴파크', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '바닷물을 끌어온 수로를 낀 공원' },
  { id: 'incheon-3', city: 'incheon', name: '차이나타운', category: 'market', kind: 'outdoor', rainOk: true, heatEscape: false, windy: false, note: '처마를 따라 이어지는 먹자골목' },
  { id: 'incheon-4', city: 'incheon', name: '월미도 문화의거리', wiki: '월미도', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '바다를 옆에 두고 걷는 거리' },

  // 경기
  { id: 'gyeonggi-1', city: 'gyeonggi', name: '수원화성', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '성곽을 따라 한 바퀴 도는 길' },
  { id: 'gyeonggi-2', city: 'gyeonggi', name: '광명동굴', category: 'nature', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '한여름에도 12도인 폐광 동굴' },
  { id: 'gyeonggi-3', city: 'gyeonggi', name: '백남준아트센터', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '비 오는 날 조용히 보기 좋은 미술관' },
  { id: 'gyeonggi-4', city: 'gyeonggi', name: '남한산성', category: 'nature', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '능선을 따라 걷는 산성길' },

  // 강원
  { id: 'gangwon-1', city: 'gangwon', name: '남이섬', category: 'nature', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '나무 터널이 길게 이어지는 섬' },
  { id: 'gangwon-2', city: 'gangwon', name: '소양강 스카이워크', wiki: '소양강', category: 'view', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '강 위를 걷는 유리 전망길' },
  { id: 'gangwon-3', city: 'gangwon', name: '춘천 애니메이션박물관', wiki: '애니메이션박물관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '날씨와 상관없는 실내 코스' },
  { id: 'gangwon-4', city: 'gangwon', name: '의암호 자전거길', wiki: '의암호', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '호수를 끼고 도는 평지 코스' },

  // 충북
  { id: 'chungbuk-1', city: 'chungbuk', name: '청주 국립현대미술관', wiki: '국립현대미술관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '담배공장을 고쳐 만든 수장고 미술관' },
  { id: 'chungbuk-2', city: 'chungbuk', name: '상당산성', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '완만한 성곽 둘레길' },
  { id: 'chungbuk-3', city: 'chungbuk', name: '대청호 오백리길', wiki: '대청호', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: false, note: '호수를 따라 그늘이 이어진다' },
  { id: 'chungbuk-4', city: 'chungbuk', name: '수암골 벽화마을', category: 'market', kind: 'outdoor', rainOk: false, heatEscape: false, windy: false, note: '언덕을 오르며 보는 골목 풍경' },

  // 충남
  { id: 'chungnam-1', city: 'chungnam', name: '독립기념관', wiki: '천안시', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '실내 전시관이 여러 동으로 이어진다' },
  { id: 'chungnam-2', city: 'chungnam', name: '남당항', wiki: '홍성군', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '바다를 보며 제철 해산물' },
  { id: 'chungnam-3', city: 'chungnam', name: '수덕사', category: 'walk', kind: 'outdoor', rainOk: true, heatEscape: true, windy: false, note: '숲길과 처마가 이어지는 절집' },
  { id: 'chungnam-4', city: 'chungnam', name: '꽃지해변', wiki: '안면도', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '해 지는 방향으로 열린 해변' },

  // 세종
  { id: 'sejong-1', city: 'sejong', name: '국립세종수목원', category: 'nature', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '유리 온실이 있어 비 오는 날도 가능' },
  { id: 'sejong-2', city: 'sejong', name: '세종호수공원', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '호수를 한 바퀴 도는 평지 산책' },
  { id: 'sejong-3', city: 'sejong', name: '국립세종도서관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '앉아서 시간을 보내기 좋은 곳' },
  { id: 'sejong-4', city: 'sejong', name: '밀마루전망대', category: 'view', kind: 'outdoor', rainOk: true, heatEscape: false, windy: false, note: '도시 전체를 한눈에 보는 실내 전망대' },

  // 대전
  { id: 'daejeon-1', city: 'daejeon', name: '국립중앙과학관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '비 오는 날 가장 안전한 선택' },
  { id: 'daejeon-2', city: 'daejeon', name: '한밭수목원', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: true, windy: false, note: '도심에서 그늘이 가장 넉넉하다' },
  { id: 'daejeon-3', city: 'daejeon', name: '장태산자연휴양림', category: 'nature', kind: 'outdoor', rainOk: false, heatEscape: true, windy: false, note: '메타세쿼이아 숲의 공중 산책로' },
  { id: 'daejeon-4', city: 'daejeon', name: '대동하늘공원', category: 'view', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '해 질 무렵 도시가 내려다보인다' },

  // 전북
  { id: 'jeonbuk-1', city: 'jeonbuk', name: '전주한옥마을', category: 'market', kind: 'outdoor', rainOk: true, heatEscape: false, windy: false, note: '처마를 따라 걸으면 비도 피해진다' },
  { id: 'jeonbuk-2', city: 'jeonbuk', name: '국립전주박물관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '넓고 조용한 실내 전시' },
  { id: 'jeonbuk-3', city: 'jeonbuk', name: '덕진공원', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: false, note: '연꽃이 덮인 연못을 낀 공원' },
  { id: 'jeonbuk-4', city: 'jeonbuk', name: '남부시장', wiki: '전주시', category: 'market', kind: 'outdoor', rainOk: true, heatEscape: false, windy: false, note: '지붕이 있는 골목 시장' },

  // 전남
  { id: 'jeonnam-1', city: 'jeonnam', name: '순천만습지', wiki: '순천만', category: 'nature', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '갈대밭 사이로 난 나무 데크' },
  { id: 'jeonnam-2', city: 'jeonnam', name: '죽녹원', category: 'walk', kind: 'outdoor', rainOk: true, heatEscape: true, windy: false, note: '대숲이 비와 볕을 함께 가려 준다' },
  { id: 'jeonnam-3', city: 'jeonnam', name: '목포근대역사관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '항구 도시의 실내 전시관' },
  { id: 'jeonnam-4', city: 'jeonnam', name: '여수 해상케이블카', category: 'view', kind: 'outdoor', rainOk: true, heatEscape: true, windy: true, note: '바다 위를 건너지만 캐빈 안은 실내' },

  // 광주
  { id: 'gwangju-1', city: 'gwangju', name: '국립아시아문화전당', wiki: '광주광역시', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '대부분의 공간이 지하 실내' },
  { id: 'gwangju-2', city: 'gwangju', name: '양림동 근대역사문화마을', wiki: '양림동', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: false, windy: false, note: '골목마다 오래된 집이 남아 있다' },
  { id: 'gwangju-3', city: 'gwangju', name: '무등산 증심사 계곡', wiki: '증심사', category: 'nature', kind: 'outdoor', rainOk: false, heatEscape: true, windy: false, note: '계곡을 따라 오르는 완만한 숲길' },
  { id: 'gwangju-4', city: 'gwangju', name: '광주호 호수생태원', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: false, note: '호수를 낀 평지 산책로' },

  // 경북
  { id: 'gyeongbuk-1', city: 'gyeongbuk', name: '하회마을', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '강이 마을을 감싸고 도는 옛 마을' },
  { id: 'gyeongbuk-2', city: 'gyeongbuk', name: '국립경주박물관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '날씨가 험할 때의 대안' },
  { id: 'gyeongbuk-3', city: 'gyeongbuk', name: '불국사', category: 'walk', kind: 'outdoor', rainOk: true, heatEscape: true, windy: false, note: '숲과 회랑이 이어지는 절집' },
  { id: 'gyeongbuk-4', city: 'gyeongbuk', name: '도산서원', category: 'view', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '호수를 앞에 둔 서원' },

  // 대구
  { id: 'daegu-1', city: 'daegu', name: '국립대구박물관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '더위를 피하기 좋은 실내' },
  { id: 'daegu-2', city: 'daegu', name: '김광석다시그리기길', wiki: '방천시장', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: false, windy: false, note: '벽화를 따라 짧게 걷는 골목' },
  { id: 'daegu-3', city: 'daegu', name: '서문시장', category: 'market', kind: 'outdoor', rainOk: true, heatEscape: false, windy: false, note: '지붕 아래로 이어지는 큰 시장' },
  { id: 'daegu-4', city: 'daegu', name: '앞산전망대', wiki: '앞산', category: 'view', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '분지 전체가 내려다보인다' },

  // 경남
  { id: 'gyeongnam-1', city: 'gyeongnam', name: '주남저수지', wiki: '창원시', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '철새가 머무는 넓은 물가' },
  { id: 'gyeongnam-2', city: 'gyeongnam', name: '국립김해박물관', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '가야 유물을 모아 둔 실내관' },
  { id: 'gyeongnam-3', city: 'gyeongnam', name: '통영 케이블카', category: 'view', kind: 'outdoor', rainOk: true, heatEscape: true, windy: true, note: '바람이 세면 운행이 멈추기도 한다' },
  { id: 'gyeongnam-4', city: 'gyeongnam', name: '진주성', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: false, windy: false, note: '강을 낀 성곽을 도는 코스' },

  // 울산
  { id: 'ulsan-1', city: 'ulsan', name: '태화강국가정원', wiki: '태화강 국가정원', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: true, windy: false, note: '대숲 그늘이 길게 이어진다' },
  { id: 'ulsan-2', city: 'ulsan', name: '대왕암공원', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '해안 바위를 따라 난 길' },
  { id: 'ulsan-3', city: 'ulsan', name: '울산박물관', wiki: '울산광역시', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '비 오는 날의 대안' },
  { id: 'ulsan-4', city: 'ulsan', name: '간절곶', category: 'view', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '바람을 그대로 맞는 해맞이 곶' },

  // 부산
  { id: 'busan-1', city: 'busan', name: '부산현대미술관', wiki: '을숙도', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '을숙도 안의 실내 미술관' },
  { id: 'busan-2', city: 'busan', name: '해운대 해수욕장', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '더운 날 물가가 가장 시원하다' },
  { id: 'busan-3', city: 'busan', name: '감천문화마을', category: 'walk', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '언덕 골목을 오르내리는 코스' },
  { id: 'busan-4', city: 'busan', name: '황령산 전망대', wiki: '황령산', category: 'view', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '야경이 가장 넓게 펼쳐진다' },

  // 제주
  { id: 'jeju-1', city: 'jeju', name: '성산일출봉', category: 'view', kind: 'outdoor', rainOk: false, heatEscape: false, windy: true, note: '바람이 세면 오르기 어렵다' },
  { id: 'jeju-2', city: 'jeju', name: '제주현대미술관', wiki: '저지리', category: 'culture', kind: 'indoor', rainOk: true, heatEscape: true, windy: false, note: '저지예술인마을 안의 실내관' },
  { id: 'jeju-3', city: 'jeju', name: '협재해수욕장', category: 'water', kind: 'outdoor', rainOk: false, heatEscape: true, windy: true, note: '얕고 넓게 펼쳐지는 바다' },
  { id: 'jeju-4', city: 'jeju', name: '사려니숲길', category: 'nature', kind: 'outdoor', rainOk: true, heatEscape: true, windy: false, note: '나무가 비와 볕을 함께 가려 준다' },
]

/** 지역 id로 그 지역의 장소만 골라낸다 */
export const spotsByCity = (cityId) => SPOTS.filter((spot) => spot.city === cityId)
