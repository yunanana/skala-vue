<script setup>
import { CITIES } from '@/data/cities.js'
import PageHeader from '@/components/PageHeader.vue'
</script>

<template>
  <PageHeader
    :index="5"
    eyebrow="About"
    title="서비스 소개"
    desc="날씨를 장소와 하루의 선택으로 연결하는 도시 생활 서비스입니다."
  >
    <template #meta>
      <span class="eyebrow">{{ CITIES.length }} CITIES</span>
    </template>
  </PageHeader>

  <div class="dashboard-wrapper">
    <p class="lead">
      날씨는 숫자로 끝나지 않습니다. 무엇을 입을지, 어디로 갈지, 오늘을 어떻게 보낼지를 바꿉니다.
      BETWEEN WEATHER는 전국 {{ CITIES.length }}개 지역의 지금 날씨를
      그날의 선택으로 옮겨 놓습니다.
    </p>

    <h3>무엇을 할 수 있나요</h3>
    <ul class="feature-list">
      <li><strong>지금, 전국</strong> — 지도에서 지역을 고르면 기온·바람·습도와 3시간 단위 예보를 봅니다</li>
      <li><strong>날씨에 맞는 장소</strong> — 비가 오면 실내가, 더우면 물가와 그늘이 위로 올라옵니다</li>
      <li><strong>내 장소</strong> — 직접 추가한 곳도 같은 기준으로 추천에 섞입니다</li>
      <li><strong>저장</strong> — 자주 보는 지역과 마음에 든 장소를 모아 한눈에 비교합니다</li>
      <li><strong>오늘의 가이드</strong> — 우산·빨래·외출을 지금 값에서 계산해 알려 줍니다</li>
    </ul>

    <h3>데이터</h3>
    <ul class="feature-list">
      <li>기상 정보는 Open-Meteo에서 실시간으로 받아 옵니다</li>
      <li>장소 사진과 설명은 위키백과에서 가져옵니다 (CC BY-SA)</li>
      <li>연결이 원활하지 않을 때는 최근 기준값을 대신 표시합니다</li>
    </ul>

    <!-- 기술 정보는 이 자리에만, 작게 둔다 -->
    <p class="stack">
      <span class="stack-label">Built with</span>
      Vue 3 Composition API · Vue Router · Pinia · Axios · Vite · SVG · Canvas · GitHub Pages
    </p>

    <div class="actions">
      <RouterLink to="/" class="link-btn">← 메인 대시보드로 돌아가기</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper h3 {
  margin-top: 26px;
}

.dashboard-wrapper h3:first-child {
  margin-top: 0;
}

.lead {
  font-size: 1.05rem;
  line-height: 1.7;
  max-width: 48ch;
}

/* 기술 정보 — 본문보다 한참 작게 */
.stack {
  margin-top: 34px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.stack-label {
  display: block;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
}

.feature-list {
  margin-top: 6px;
}

.feature-list li {
  padding: 8px 0 8px 14px;
  border-left: 2px solid var(--border);
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.link-btn {
  display: inline-block;
  padding: 7px 13px;
  border: 1px solid var(--border);
  font-size: 0.85rem;
  font-weight: 500;
}

.link-btn:hover {
  border-color: var(--hover-border);
  background: var(--bg-hover);
  color: var(--text);
}
</style>
