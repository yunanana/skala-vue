<script setup>
/**
 * 무언가 실패했을 때 보여 주는 안내
 *
 * 사용자에게는 무엇을 할 수 있는지만 알려 주고,
 * 원인(응답 코드, 키 설정 등)은 콘솔에 남긴다.
 */
defineProps({
  label: {
    type: String,
    default: 'Connection',
  },
  message: {
    type: String,
    default: '실시간 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.',
  },
  retryLabel: {
    type: String,
    default: '다시 시도',
  },
  // 다시 시도 버튼을 눌러도 되는 상태인지
  busy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['retry'])
</script>

<template>
  <div class="error-panel" role="alert">
    <div>
      <p class="error-label">{{ label }}</p>
      <p class="error-text">{{ message }}</p>
    </div>

    <button type="button" :disabled="busy" @click="emit('retry')">
      {{ busy ? '불러오는 중…' : retryLabel }}
    </button>
  </div>
</template>

<style scoped>
.error-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 16px;
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent);
}

.error-label {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.error-text {
  margin-top: 5px;
  font-size: 0.88rem;
  color: var(--text);
}

.error-panel button {
  margin: 0;
}
</style>
