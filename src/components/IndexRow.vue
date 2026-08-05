<script setup>
import { computed } from 'vue'

/**
 * 목록 한 줄 (인덱스 행)
 *
 * 번호 · 큰 제목 · 태그 · 동작 버튼을 한 줄에 놓고 헤어라인으로만 나눈다.
 * 카드보다 훑어보기 쉬워서 게시글·회원처럼 "목록"인 화면에 쓴다.
 */
const props = defineProps({
  index: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
    required: true,
  },
  // 제목 아래 한 줄 설명 (없으면 표시하지 않는다)
  subtitle: {
    type: String,
    default: '',
  },
  // 오른쪽에 붙는 짧은 라벨들 ['STUDENT', '2026-08-05']
  tags: {
    type: Array,
    default: () => [],
  },
  // 줄 전체를 누를 수 있는지 (누르면 select 이벤트를 올린다)
  clickable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])

const indexLabel = computed(() => String(props.index).padStart(3, '0'))
</script>

<template>
  <div class="index-row" :class="{ clickable }" @click="clickable && emit('select')">
    <span class="row-index">{{ indexLabel }}</span>

    <div class="row-main">
      <h3 class="row-title">{{ title }}</h3>
      <p v-if="subtitle" class="row-subtitle">{{ subtitle }}</p>
    </div>

    <div class="row-tags">
      <span v-for="tag in tags" :key="tag" class="row-tag">{{ tag }}</span>
    </div>

    <!-- 수정·삭제 같은 버튼을 부모가 끼워 넣는 자리 -->
    <div class="row-actions" @click.stop>
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.index-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 16px;
  padding: 18px 4px;
  border-top: 1px solid var(--border);
  transition: background-color 0.15s ease;
}

.index-row:last-child {
  border-bottom: 1px solid var(--border);
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background: var(--accent-soft);
}

.row-index {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.row-main {
  min-width: 0;
}

/* 목록의 주인공. 큰 글씨로 두고 자간을 조인다 */
.row-title {
  margin: 0;
  font-size: clamp(1.15rem, 2.2vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-subtitle {
  margin-top: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.row-tag {
  padding: 3px 8px;
  border: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  white-space: nowrap;
}

.row-actions {
  display: flex;
  gap: 6px;
}

@media (max-width: 750px) {
  .index-row {
    grid-template-columns: 32px minmax(0, 1fr);
    gap: 10px;
  }
  .row-tags,
  .row-actions {
    grid-column: 2;
    justify-content: flex-start;
  }
}
</style>
