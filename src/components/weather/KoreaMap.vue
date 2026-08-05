<script setup>
import { computed, onUnmounted, ref } from 'vue'

import { MAP_VIEWBOX, PROVINCES } from '@/data/koreaProvinces.js'
import { tempColor, readableInk, tempLegend } from '@/utils/tempScale.js'

/**
 * 시도별 기온 지도 (SVG)
 *
 * 지도 라이브러리도, 외부 타일 요청도 쓰지 않는다.
 * 미리 변환해 둔 시도 경계를 그리고, 그 지역 기온으로 면을 칠한 뒤
 * 도형 위에 기온 라벨을 얹는다.
 */
const props = defineProps({
  // 부모가 내려주는 지역별 날씨 목록
  cityItems: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: String,
    default: '',
  },
})

// 지역을 고르면 부모에게 알린다
const emit = defineEmits(['select-city'])

// 색 스케일이 모드별로 다르므로 테마 변화를 따라다닌다
const isDark = ref(document.documentElement.classList.contains('theme-dark'))
const themeObserver = new MutationObserver(() => {
  isDark.value = document.documentElement.classList.contains('theme-dark')
})
themeObserver.observe(document.documentElement, { attributeFilter: ['class'] })

// 화면에서 사라질 때 관찰을 멈춘다
onUnmounted(() => themeObserver.disconnect())

const legend = computed(() => tempLegend(isDark.value))

/**
 * 시도 도형 + 그 지역 날씨를 하나로 묶는다.
 * 라벨이 서로 겹치는 수도권·영남권은 offset으로 조금씩 밀어 놓는다.
 */
const LABEL_OFFSET = {
  서울특별시: [-10, -30],
  인천광역시: [-52, 4],
  경기도: [6, 50],
  // 세종·대전·충남은 서로 붙어 있어 세 방향으로 벌려 놓는다
  세종특별자치시: [-14, -34],
  충청남도: [-40, 12],
  대전광역시: [16, 28],
  충청북도: [14, -12],
  대구광역시: [26, -6],
  울산광역시: [42, 8],
  부산광역시: [20, 30],
  // 광주는 전남 안에 있어서 위로 띄운다
  광주광역시: [-54, -8],
  전라남도: [14, 30],
  경상북도: [-14, 14],
}

const regions = computed(() =>
  PROVINCES.map((province) => {
    const item = props.cityItems.find((city) => city.province === province.name)
    const [dx, dy] = LABEL_OFFSET[province.name] ?? [0, 0]

    return {
      ...province,
      item,
      // 데이터가 없는 지역은 회색으로 남긴다 (색만 보고 오해하지 않도록)
      fill: item ? tempColor(item.temp, isDark.value) : 'transparent',
      ink: item ? readableInk(tempColor(item.temp, isDark.value)) : 'currentColor',
      labelX: province.cx + dx,
      labelY: province.cy + dy,
    }
  }),
)

const select = (region) => {
  if (region.item) emit('select-city', region.item)
}
</script>

<template>
  <div class="map-box">
    <svg
      class="map-svg"
      :viewBox="`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`"
      role="img"
      aria-label="시도별 기온 지도"
    >
      <!-- 1) 면 -->
      <path
        v-for="region in regions"
        :key="region.name"
        :d="region.path"
        class="province"
        :class="{
          selected: region.item && region.item.id === selectedId,
          empty: !region.item,
        }"
        :fill="region.fill"
        @click="select(region)"
      >
        <title>{{ region.name }}{{ region.item ? ` ${region.item.temp}°C` : ' · 데이터 없음' }}</title>
      </path>

      <!-- 2) 라벨 (면 위에 얹는다) -->
      <g
        v-for="region in regions"
        :key="`label-${region.name}`"
        class="label"
        :class="{ clickable: region.item }"
        @click="select(region)"
      >
        <rect
          :x="region.labelX - 33"
          :y="region.labelY - 26"
          width="66"
          height="52"
          rx="7"
          class="label-box"
        />
        <text :x="region.labelX" :y="region.labelY - 6" class="label-name">
          {{ region.item ? region.item.name : region.name.slice(0, 2) }}
        </text>
        <text :x="region.labelX" :y="region.labelY + 17" class="label-temp">
          {{ region.item ? `${region.item.temp}°` : '–' }}
        </text>
      </g>
    </svg>

    <!-- 색상 범례: 색만으로 값을 읽지 않도록 구간 라벨을 함께 둔다 -->
    <div class="legend">
      <span class="legend-title">기온</span>
      <div class="legend-scale">
        <span
          v-for="l in legend"
          :key="l.label"
          class="legend-step"
          :style="{ background: l.hex }"
          :title="l.label"
        ></span>
      </div>
      <span class="legend-ends">0°C 미만 → 35°C 이상</span>
    </div>

    <p class="map-hint">지역을 클릭하면 해당 지역의 상세 날씨가 표시됩니다.</p>
  </div>
</template>

<style scoped>
.map-box {
  margin-top: 6px;
}

.map-svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 78vh;
  margin: 0 auto;
}

/* ---------------- 시도 도형 ---------------- */
.province {
  stroke: var(--bg);
  stroke-width: 2;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.province:hover {
  opacity: 0.75;
}

/* 선택한 지역만 테두리를 강조한다 */
.province.selected {
  stroke: var(--accent);
  stroke-width: 4;
}

/* 관측값이 없는 지역 */
.province.empty {
  fill: var(--bg-hover);
  stroke: var(--border);
  cursor: default;
}

.province.empty:hover {
  opacity: 1;
}

/* ---------------- 라벨 ---------------- */
.label {
  pointer-events: none;
}

.label.clickable {
  pointer-events: auto;
  cursor: pointer;
}

.label-box {
  fill: var(--bg);
  stroke: var(--border-strong);
  stroke-width: 1.5;
}

.label-name,
.label-temp {
  text-anchor: middle;
  fill: var(--text);
}

.label-name {
  font-size: 21px;
  font-weight: 700;
}

.label-temp {
  font-family: var(--font-mono);
  font-size: 23px;
  font-weight: 700;
}

/* ---------------- 범례 ---------------- */
.legend {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.legend-title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.legend-scale {
  display: flex;
  border: 1px solid var(--border);
}

.legend-step {
  width: 26px;
  height: 12px;
}

.legend-ends {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-muted);
}

.map-hint {
  margin-top: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
