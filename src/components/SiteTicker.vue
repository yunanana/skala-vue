<script setup>
import { computed } from 'vue'

/**
 * 화면 상단에 흐르는 마퀴 띠
 *
 * 같은 문구를 두 벌 이어 붙이고 절반만큼 이동시키면, 끊김 없이 계속 흐른다.
 * 애니메이션은 CSS가 담당하고 Vue는 문구와 속도만 넘긴다.
 */
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  // 한 바퀴 도는 데 걸리는 시간(초). 클수록 느리게 흐른다.
  duration: {
    type: Number,
    default: 42,
  },
})

// 두 벌을 이어 붙여야 끝과 시작이 맞물린다
const loopedItems = computed(() => [...props.items, ...props.items])
const style = computed(() => ({ '--ticker-duration': `${props.duration}s` }))
</script>

<template>
  <div class="ticker" :style="style" aria-hidden="true">
    <div class="ticker-track">
      <span v-for="(item, i) in loopedItems" :key="`${item}-${i}`" class="ticker-item">
        {{ item }}
        <span class="ticker-dot">◆</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  position: relative;
  height: var(--ticker-height);
  display: flex;
  align-items: center;
  overflow: hidden;
  background: var(--accent);
  color: var(--accent-ink);
  border-bottom: 1px solid var(--border);
}

.ticker-track {
  display: flex;
  flex: none;
  white-space: nowrap;
  animation: ticker-scroll var(--ticker-duration) linear infinite;
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 20px;
  padding-right: 20px;
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
}

.ticker-dot {
  font-size: 0.5rem;
  opacity: 0.75;
}

@keyframes ticker-scroll {
  from {
    transform: translateX(0);
  }
  to {
    /* 두 벌 중 한 벌만큼 밀면 원래 자리로 돌아온 것처럼 보인다 */
    transform: translateX(-50%);
  }
}

/* 움직임을 줄이도록 설정한 사용자에게는 흐르지 않게 한다 */
@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    animation: none;
  }
}
</style>
