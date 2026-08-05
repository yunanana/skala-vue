<script setup>
import { computed, onUnmounted, ref } from 'vue'

import { CATEGORIES } from '@/data/spots.js'
import { fetchSpotMedia } from '@/api/wikiApi.js'

/**
 * 장소 한 곳을 보여 주는 카드
 *
 * 사진은 화면에 들어올 때만 받아 온다. (68곳을 한꺼번에 부르지 않기 위해)
 * 사진이 없으면 갈래별 색·무늬 타일이 그대로 남는다.
 */
const props = defineProps({
  spot: {
    type: Object,
    required: true,
  },
  // 목록에서 몇 번째인지 (01, 02 …)
  rank: {
    type: Number,
    default: 0,
  },
  saved: {
    type: Boolean,
    default: false,
  },
  // 사용자가 직접 추가한 장소인지 (수정·삭제 버튼이 붙는다)
  mine: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-save', 'edit', 'remove'])

const category = computed(() => CATEGORIES[props.spot.category] ?? { label: '기타', tint: 'gray' })
const rankLabel = computed(() => String(props.rank).padStart(2, '0'))

const cardRef = ref(null)
const media = ref(null)
const isImageReady = ref(false)

/** 카드가 화면에 들어오면 그때 사진을 받아 온다 */
const observer = new IntersectionObserver(
  async (entries) => {
    if (!entries[0]?.isIntersecting) return
    observer.disconnect()

    media.value = await fetchSpotMedia(props.spot.wiki ?? props.spot.name)
  },
  { rootMargin: '200px' },
)

// 카드 요소가 붙는 순간 관찰을 시작한다
const attach = (el) => {
  cardRef.value = el
  if (el) observer.observe(el)
}

onUnmounted(() => observer.disconnect())
</script>

<template>
  <article :ref="attach" class="spot-card" :data-tint="category.tint">
    <!-- 사진이 없으면 이 타일이 그대로 남는다 -->
    <div class="visual">
      <img
        v-if="media?.image"
        :src="media.image"
        :alt="`${spot.name} 사진`"
        loading="lazy"
        decoding="async"
        :class="{ ready: isImageReady }"
        @load="isImageReady = true"
        @error="media = null"
      />

      <span class="rank">{{ rankLabel }}</span>
      <span class="kind">
        <em v-if="mine" class="mine-badge">내 장소</em>
        {{ spot.kind === 'indoor' ? '실내' : '실외' }}
      </span>
      <span class="score">{{ spot.score }}</span>
    </div>

    <div class="body">
      <span class="category">{{ category.label }}</span>
      <h3 class="name">{{ spot.name }}</h3>
      <p class="note">{{ spot.note }}</p>

      <!-- 왜 지금 이 곳인지 -->
      <ul v-if="spot.reasons?.length" class="reasons">
        <li v-for="reason in spot.reasons" :key="reason">{{ reason }}</li>
      </ul>

      <div class="foot">
        <div class="actions">
          <button type="button" class="save-btn" @click="emit('toggle-save', spot)">
            {{ saved ? '저장됨' : '저장' }}
          </button>

          <!-- 내가 추가한 장소만 고치거나 지울 수 있다 -->
          <template v-if="mine">
            <button type="button" class="save-btn" @click="emit('edit', spot)">수정</button>
            <button type="button" class="save-btn" @click="emit('remove', spot)">삭제</button>
          </template>
        </div>

        <a v-if="media?.link" :href="media.link" target="_blank" rel="noopener" class="credit">
          위키백과 ↗
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.spot-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  background: var(--bg);
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    transform 0.25s cubic-bezier(0.2, 0.7, 0.3, 1);
}

.spot-card:hover {
  border-color: var(--hover-border);
  transform: translateY(-3px);
}

/* ---------------- 사진 자리 ---------------- */
.visual {
  position: relative;
  height: 168px;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  color: #111111;
  /* 사진이 오기 전(또는 없을 때) 보이는 갈래별 무늬 */
  background-color: var(--tile-color);
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(17, 17, 17, 0.12) 0 2px,
    transparent 2px 9px
  );
}

.visual img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.04);
  transition:
    opacity 0.5s ease,
    transform 0.6s cubic-bezier(0.2, 0.7, 0.3, 1);
}

/* 다 불러온 뒤에 부드럽게 나타난다 */
.visual img.ready {
  opacity: 1;
  transform: scale(1);
}

.spot-card:hover .visual img.ready {
  transform: scale(1.06);
}

/* 사진 위 글자가 묻히지 않도록 아래쪽에 그늘을 깐다 */
.visual::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 45%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.spot-card:has(img.ready) .visual::after {
  opacity: 1;
}

.rank,
.kind,
.score {
  position: absolute;
  z-index: 1;
  font-family: var(--font-mono);
}

.rank {
  left: 12px;
  bottom: 10px;
  font-size: 2.1rem;
  font-weight: 700;
  line-height: 1;
}

.kind {
  right: 12px;
  top: 12px;
  padding: 2px 7px;
  background: #111111;
  color: #ffffff;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
}

/* 점수는 오른쪽 아래에 크게 */
.score {
  right: 12px;
  bottom: 10px;
  font-size: 1.35rem;
  font-weight: 700;
}

/* 사진이 깔리면 글자를 흰색으로 뒤집는다 */
.spot-card:has(img.ready) .rank,
.spot-card:has(img.ready) .score {
  color: #ffffff;
}

[data-tint='violet'] {
  --tile-color: #c9c2f0;
}
[data-tint='cyan'] {
  --tile-color: #a9d8e0;
}
[data-tint='green'] {
  --tile-color: #b6d8b4;
}
[data-tint='blue'] {
  --tile-color: #bbcbfb;
}
[data-tint='orange'] {
  --tile-color: #edcaa4;
}
[data-tint='lime'] {
  --tile-color: #d3dfa2;
}
[data-tint='gray'] {
  --tile-color: #d5d5d5;
}

/* ---------------- 본문 ---------------- */
.body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 13px 14px 14px;
}

.category {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--text-muted);
}

.name {
  margin: 7px 0 5px;
  font-size: 1.1rem;
  letter-spacing: -0.03em;
}

.note {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 11px;
}

.reasons li {
  padding: 3px 7px;
  border: 1px solid var(--border);
  font-size: 0.7rem;
  color: var(--text-meta);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 14px;
}

.actions {
  display: flex;
  gap: 5px;
}

.save-btn {
  margin: 0;
  padding: 6px 10px;
  font-size: 0.64rem;
}

/* 내가 추가한 장소 표시 */
.mine-badge {
  font-style: normal;
  margin-right: 5px;
  padding-right: 5px;
  border-right: 1px solid rgba(255, 255, 255, 0.4);
}

.credit {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.credit:hover {
  color: var(--accent-text);
}

@media (prefers-reduced-motion: reduce) {
  .spot-card,
  .visual img {
    transition: none;
  }
  .spot-card:hover {
    transform: none;
  }
}
</style>
