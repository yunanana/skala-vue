<script setup>
import { computed } from 'vue'

/**
 * 첫 진입 화면
 *
 * 숫자는 꾸며 낸 것이 아니라 실제로 받은 지역 수를 그대로 센다.
 * 다 받으면 화면이 걷히고 날씨가 드러난다.
 */
const props = defineProps({
  // 0~100
  progress: {
    type: Number,
    default: 0,
  },
  // 받은 지역 수 / 전체 지역 수
  loaded: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  // 다 받았으면 화면을 걷는다
  done: {
    type: Boolean,
    default: false,
  },
})

const percent = computed(() => String(Math.min(100, Math.round(props.progress))).padStart(3, '0'))
</script>

<template>
  <div class="intro" :class="{ leaving: done }" role="status" aria-live="polite">
    <!-- 채워지는 만큼 아래에서 위로 차오른다 -->
    <div class="fill" :style="{ height: `${progress}%` }" aria-hidden="true"></div>

    <div class="inner">
      <p class="label">Reading the sky</p>

      <p class="count">
        {{ percent }}<i>%</i>
      </p>

      <p class="detail">전국 {{ total }}개 지역 · {{ loaded }}곳 확인</p>
    </div>

    <p class="brand">BETWEEN·WEATHER</p>
  </div>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 var(--gutter);
  background: var(--bg);
  transition:
    opacity 0.5s ease,
    visibility 0.5s ease;
}

/* 다 받으면 걷힌다 */
.leaving {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

/* 진행률만큼 차오르는 면 */
.fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--accent-soft);
  transition: height 0.4s cubic-bezier(0.2, 0.7, 0.3, 1);
}

.inner {
  position: relative;
  max-width: var(--container-max);
  width: 100%;
  margin: 0 auto;
}

.label,
.detail,
.brand {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

/* 숫자가 화면의 주인공 */
.count {
  margin: 10px 0 12px;
  font-family: var(--font-mono);
  font-size: clamp(5rem, 20vw, 16rem);
  font-weight: 700;
  line-height: 0.82;
  letter-spacing: -0.06em;
  font-variant-numeric: tabular-nums;
}

.count i {
  font-style: normal;
  font-size: 0.22em;
  vertical-align: super;
  color: var(--text-muted);
}

.brand {
  position: absolute;
  left: var(--gutter);
  bottom: 26px;
}

@media (prefers-reduced-motion: reduce) {
  .intro,
  .fill {
    transition: none;
  }
}
</style>
