<script setup>
import { computed } from 'vue'

/**
 * 모든 화면이 공통으로 쓰는 페이지 머리말
 *
 * (01) 인덱스 번호 · 고정폭 대문자 라벨 · 큰 제목 · 설명 순서로 쌓는다.
 * 화면마다 따로 만들던 마크업과 스타일을 하나로 모아 재사용한다.
 */
const props = defineProps({
  // 화면 순번. 편집 디자인처럼 (01) 형태로 보여 준다.
  index: {
    type: Number,
    default: 0,
  },
  // 제목 위에 붙는 작은 라벨
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    default: '',
  },
})

const indexLabel = computed(() => (props.index ? `(${String(props.index).padStart(2, '0')})` : ''))
</script>

<template>
  <header class="page-header">
    <div class="header-meta">
      <span v-if="indexLabel" class="index-num">{{ indexLabel }}</span>
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>

      <!-- 화면별로 버튼·상태 표시를 오른쪽에 끼워 넣을 수 있다 -->
      <div class="header-slot">
        <slot name="meta" />
      </div>
    </div>

    <!-- 큰 제목은 왼쪽, 설명은 오른쪽 아래 — 편집 디자인의 2단 배치 -->
    <div class="header-body">
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="desc" class="page-desc">{{ desc }}</p>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  padding: 56px 0 26px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 30px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 22px;
}

.header-slot {
  margin-left: auto;
}

.header-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 34ch);
  align-items: end;
  gap: 24px;
}

.page-title {
  margin: 0;
  /* 화면 제목은 읽기 좋은 크기까지만 키운다 (장식용 큰 글자와 구분) */
  font-size: clamp(1.75rem, 3.2vw, 2.6rem);
  letter-spacing: -0.035em;
  /* 한글도 자간을 조여 제목의 밀도를 맞춘다 */
  word-break: keep-all;
}

.page-desc {
  padding-bottom: 10px;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .header-body {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 14px;
  }
  .page-desc {
    padding-bottom: 0;
  }
}

@media (max-width: 750px) {
  .page-header {
    padding: 30px 0 20px;
    margin-bottom: 22px;
  }
}
</style>
