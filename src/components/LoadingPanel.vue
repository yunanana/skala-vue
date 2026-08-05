<script setup>
/**
 * 불러오는 중에 보여 주는 자리 표시 격자
 *
 * "Loading..." 한 줄 대신, 곧 채워질 자리를 미리 그려 두면
 * 화면이 덜컥거리지 않고 얼마나 기다릴지도 가늠하기 쉽다.
 */
defineProps({
  // 영문 소제목 (에디토리얼 톤을 위해 대문자로 쓴다)
  label: {
    type: String,
    default: 'Loading',
  },
  message: {
    type: String,
    default: '잠시만 기다려 주세요',
  },
  // 자리 표시 칸 개수
  rows: {
    type: Number,
    default: 4,
  },
})
</script>

<template>
  <div class="loading-panel" role="status" aria-live="polite">
    <p class="loading-label">{{ label }}</p>
    <p class="loading-text">{{ message }}</p>

    <div class="skeleton-grid">
      <div v-for="row in rows" :key="row" class="skeleton-cell" />
    </div>
  </div>
</template>

<style scoped>
.loading-panel {
  padding: 22px 0;
}

.loading-label {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.loading-text {
  margin: 6px 0 14px;
  font-size: 0.9rem;
  color: var(--text);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
}

.skeleton-cell {
  height: 64px;
  background: var(--bg);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-cell:nth-child(2n) {
  animation-delay: 0.2s;
}
.skeleton-cell:nth-child(3n) {
  animation-delay: 0.4s;
}

@keyframes skeleton-pulse {
  50% {
    background: var(--bg-hover);
  }
}

/* 움직임을 줄이도록 설정한 사용자에게는 깜빡이지 않게 한다 */
@media (prefers-reduced-motion: reduce) {
  .skeleton-cell {
    animation: none;
  }
}
</style>
