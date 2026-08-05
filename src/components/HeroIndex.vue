<script setup>
import { RouterLink } from 'vue-router'

/**
 * 첫 화면 오른쪽 목차
 *
 * 구름 모양을 배경 효과와 같은 옅기로 크게 깔고,
 * 그 위에 밑줄 친 목차를 얹는다.
 */

// 페이지 이동과 같은 화면 안의 자리 이동을 함께 담는다
const items = [
  { label: '지도에서 지역 고르기', to: '#map' },
  { label: '이 날씨에 갈 만한 곳', to: '#picks' },
  { label: '명소 전체 보기', to: '/spots' },
  { label: '오늘의 가이드', to: '/guide' },
  { label: '저장한 지역과 장소', to: '/saved' },
  { label: '서비스 소개', to: '/about' },
]

const isAnchor = (to) => to.startsWith('#')

/** 같은 화면 안에서는 부드럽게 그 자리로 내려간다 */
const scrollTo = (to) => {
  document.querySelector(to)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="hero-index">
    <!-- 목차를 통째로 품는 구름 (비율을 그대로 지켜 늘어나지 않게 한다) -->
    <svg class="cloud" viewBox="0 0 900 520" aria-hidden="true">
      <g>
        <circle cx="270" cy="300" r="132" />
        <circle cx="405" cy="230" r="168" />
        <circle cx="575" cy="218" r="152" />
        <circle cx="700" cy="300" r="126" />
        <circle cx="345" cy="360" r="118" />
        <circle cx="620" cy="362" r="112" />
        <rect x="270" y="300" width="430" height="150" rx="75" />
      </g>
    </svg>

    <nav class="index" aria-label="바로 가기">
      <p class="index-label">Between Weather</p>
      <h2 class="index-title">오늘, 어디로 갈까요?</h2>
      <p class="index-desc">지금 날씨에 맞는 곳을 골라 드립니다</p>

      <ul>
        <li v-for="(item, position) in items" :key="item.to">
          <span class="num">{{ String(position + 1).padStart(2, '0') }}</span>

          <a v-if="isAnchor(item.to)" :href="item.to" @click.prevent="scrollTo(item.to)">
            {{ item.label }}
          </a>
          <RouterLink v-else :to="item.to">{{ item.label }}</RouterLink>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.hero-index {
  position: relative;
  display: flex;
  align-items: center;
  /* 구름이 글자를 감싸려면 글자가 칸 한가운데 있어야 한다 */
  justify-content: center;
  min-height: 320px;
}

/* 구름은 목차를 통째로 감싼다 (배경 효과와 같은 옅기) */
.cloud {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  /* 비율은 그대로 두고 크기만 키운다 (화면 밖으로 조금 흘러넘쳐도 된다) */
  width: 200%;
  height: auto;
  fill: var(--text);
  opacity: 0.09;
  pointer-events: none;
}

.theme-dark .cloud {
  opacity: 0.13;
}

/* ---------------- 목차 ---------------- */
.index {
  position: relative;
  text-align: right;
  padding: 34px 0 38px;
}

.index-label {
  margin-bottom: 8px;
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.index-title {
  margin: 0;
  font-size: clamp(1.4rem, 2.4vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.index-desc {
  margin: 8px 0 18px;
  font-size: 0.86rem;
  color: var(--text-muted);
}

.index li {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 12px;
  padding: 5px 0;
}

.num {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  color: var(--text-muted);
}

/* 목차는 밑줄 친 글씨 */
.index a {
  font-size: 1.02rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}

.index a:hover {
  color: var(--accent-text);
  text-decoration-thickness: 2px;
}

@media (max-width: 900px) {
  .hero-index {
    justify-content: flex-start;
    min-height: 0;
    margin-top: 26px;
  }

  .index,
  .index li {
    text-align: left;
    justify-content: flex-start;
  }

  .cloud {
    width: 190%;
  }
}
</style>
