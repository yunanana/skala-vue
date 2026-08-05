<script setup>
import { onMounted, ref, watch } from 'vue'

import { systemApi } from '@/api/systemApi.js'

/**
 * 데이터 연결 상태 표시줄
 *
 * 서버가 살아 있는지와 지금 데이터가 몇 건인지 보여 준다.
 * 기록·준비물 화면에서 함께 사용한다.
 */
const props = defineProps({
  // 값이 바뀔 때마다 상태를 다시 조회한다 (목록을 새로 불러온 뒤 갱신용)
  refreshKey: {
    type: Number,
    default: 0,
  },
})

const health = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const loadHealth = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    health.value = await systemApi.getHealth()
  } catch (err) {
    health.value = null
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}

watch(() => props.refreshKey, loadHealth)
onMounted(loadHealth)
</script>

<template>
  <div class="api-status">
    <el-tag v-if="isLoading" type="info" size="small">확인 중…</el-tag>

    <el-tag v-else-if="errorMessage" type="danger" size="small">연결 끊김</el-tag>

    <template v-else-if="health">
      <el-tag type="success" size="small">연결됨</el-tag>
      <el-tag type="info" size="small">준비물 {{ health.productCount }}</el-tag>
      <el-tag type="info" size="small">기록 {{ health.postCount }}</el-tag>
      <el-tag v-if="health.memberCount" type="info" size="small">
        계정 {{ health.memberCount }}
      </el-tag>
    </template>
  </div>
</template>

<style scoped>
.api-status {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
</style>
