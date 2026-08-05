<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import IndexRow from '@/components/IndexRow.vue'
import PageHeader from '@/components/PageHeader.vue'
import { memberApi } from '@/api/memberApi.js'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()

const members = ref([])
const keyword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

/** 검색어로 걸러 낸 목록 — 서버를 다시 부르지 않고 화면에서 계산한다 */
const visibleMembers = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return members.value

  return members.value.filter((member) =>
    [member.name, member.email, member.role].some((value) =>
      value.toLowerCase().includes(query),
    ),
  )
})

const formatDate = (dateText) =>
  new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(dateText))

/** GET /api/members — 로그인 상태에서만 응답을 준다 */
const loadMembers = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    members.value = await memberApi.getAll()
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}

/** DELETE /api/members/:id — 본인 계정은 서버가 막는다 */
const removeMember = async (member) => {
  try {
    await ElMessageBox.confirm(`${member.name} 회원을 삭제할까요?`, '회원 삭제', {
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      type: 'warning',
    })
  } catch {
    return // 사용자가 취소한 경우
  }

  try {
    await memberApi.remove(member.id)
    ElMessage.success('회원이 삭제되었습니다.')
    await loadMembers()
  } catch (err) {
    ElMessage.error(err.message)
  }
}

onMounted(loadMembers)
</script>

<template>
  <PageHeader
    :index="8"
    eyebrow="Account"
    title="계정"
    desc="이 서비스를 함께 쓰는 계정 목록입니다. 로그인한 사람만 볼 수 있습니다."
  >
    <template #meta>
      <span class="eyebrow">{{ visibleMembers.length }}개 계정</span>
    </template>
  </PageHeader>

  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">계정 목록</h2>

      <div class="panel-tools">
        <input v-model.trim="keyword" type="search" placeholder="이름·이메일·권한 검색" />
        <button type="button" :disabled="isLoading" @click="loadMembers">
          {{ isLoading ? '불러오는 중…' : '새로고침' }}
        </button>
        <RouterLink to="/signup" class="cta">+ 회원가입</RouterLink>
      </div>
    </div>

    <p v-if="isLoading && members.length === 0" class="state-msg">회원 목록을 불러오는 중입니다…</p>
    <p v-else-if="errorMessage" class="state-msg error">{{ errorMessage }}</p>
    <p v-else-if="visibleMembers.length === 0" class="state-msg">조건에 맞는 회원이 없습니다.</p>

    <!-- 목록 한 줄 한 줄은 IndexRow가 그린다 (props로 내려주고, 삭제 버튼은 슬롯으로 끼운다) -->
    <IndexRow
      v-for="(member, position) in visibleMembers"
      :key="member.id"
      :index="position + 1"
      :title="member.name"
      :subtitle="member.email"
      :tags="[member.role, member.department, formatDate(member.joinedAt)]"
    >
      <template #actions>
        <button
          type="button"
          :disabled="member.id === authStore.user?.id"
          :title="member.id === authStore.user?.id ? '로그인한 본인 계정입니다' : '회원 삭제'"
          @click="removeMember(member)"
        >
          삭제
        </button>
      </template>
    </IndexRow>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 24px 26px 8px;
}

.panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 18px;
}

.panel-title {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.panel-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-tools input {
  width: 220px;
}

.panel-tools button {
  margin: 0;
}

/* 회원가입으로 보내는 강조 링크 */
.cta {
  padding: 7px 14px;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.cta:hover {
  background: transparent;
  color: var(--accent);
}

.state-msg {
  padding: 28px 0;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border);
}

.state-msg.error {
  color: var(--accent);
}

@media (max-width: 750px) {
  .panel {
    padding: 18px 16px 6px;
  }
  .panel-tools {
    width: 100%;
  }
  .panel-tools input {
    flex: 1;
    width: auto;
  }
}
</style>
