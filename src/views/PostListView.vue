<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { postApi } from '@/api/postApi.js'
import DataStatus from '@/components/DataStatus.vue'
import PageHeader from '@/components/PageHeader.vue'
import IndexRow from '@/components/IndexRow.vue'

const posts = ref([])
// 목록을 새로 불러올 때마다 1씩 올려, 상태 표시줄도 함께 갱신되게 한다
const dataVersion = ref(0)
const query = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const editingId = ref(null)
const dialogVisible = ref(false)

const emptyForm = () => ({ title: '', author: '', content: '' })
const form = reactive(emptyForm())

const formatDate = (dateText) =>
  new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateText))

/** GET /api/posts — 검색어가 있으면 q로 넘긴다 */
const loadPosts = async () => {
  isLoading.value = true
  try {
    posts.value = await postApi.getAll({ q: query.value || undefined })
    dataVersion.value += 1
  } catch (err) {
    // http.js의 응답 인터셉터가 메시지를 정리해서 넘겨준다
    ElMessage.error(err.message)
  } finally {
    isLoading.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

const startEdit = (post) => {
  editingId.value = post.id
  Object.assign(form, { title: post.title, author: post.author, content: post.content })
  dialogVisible.value = true
}

/** POST(신규) 또는 PATCH(수정) */
const submitPost = async () => {
  if (!form.title.trim()) {
    ElMessage.warning('게시글 제목은 필수입니다.')
    return
  }

  isSaving.value = true
  try {
    if (editingId.value === null) {
      await postApi.create({ ...form })
      ElMessage.success('새 게시글이 등록되었습니다.')
    } else {
      await postApi.update(editingId.value, { ...form })
      ElMessage.success('게시글이 수정되었습니다.')
    }

    dialogVisible.value = false
    await loadPosts()
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    isSaving.value = false
  }
}

/** DELETE /api/posts/:id */
const removePost = async (post) => {
  try {
    await ElMessageBox.confirm(`"${post.title}" 게시글을 삭제할까요?`, '삭제 확인', {
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      type: 'warning',
    })
  } catch {
    return // 사용자가 취소한 경우
  }

  try {
    await postApi.remove(post.id)
    ElMessage.success('게시글이 삭제되었습니다.')
    await loadPosts()
  } catch (err) {
    ElMessage.error(err.message)
  }
}

const clearSearch = () => {
  query.value = ''
  loadPosts()
}

onMounted(loadPosts)
</script>

<template>
  <PageHeader
    :index="3"
    eyebrow="Journal"
    title="하루 기록"
    desc="그날의 날씨와 함께 남긴 기록입니다. 쓰고, 고치고, 지울 수 있습니다."
  >
    <template #meta>
      <span class="eyebrow">{{ posts.length }}개의 기록</span>
    </template>
  </PageHeader>

  <!-- 검색 -->
  <el-card class="section" shadow="never">
    <template #header>
      <div class="section-head">
        <h3>기록 찾기</h3>
        <DataStatus :refresh-key="dataVersion" />
      </div>
    </template>

    <el-form :inline="true" @submit.prevent="loadPosts">
      <el-form-item>
        <el-input v-model.trim="query" placeholder="제목·내용·작성자로 찾기" clearable style="width: 240px" @keyup.enter="loadPosts" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="isLoading" @click="loadPosts">조회</el-button>
        <el-button @click="clearSearch">초기화</el-button>
        <el-button @click="openCreate">새 기록</el-button>
      </el-form-item>
    </el-form>
  </el-card>

  <!-- 목록 -->
  <el-card class="section" shadow="never">
    <template #header>
      <div class="section-head">
        <h3>남긴 기록</h3>
      </div>
    </template>

    <div v-loading="isLoading" class="list-area">
      <el-empty v-if="!isLoading && posts.length === 0" description="아직 남긴 기록이 없습니다." :image-size="70" />

      <!-- 카드 대신 한 줄짜리 인덱스 행 — 제목이 커서 목록을 훑기 쉽다 -->
      <IndexRow
        v-for="(post, position) in posts"
        v-else
        :key="post.id"
        :index="position + 1"
        :title="post.title"
        :subtitle="post.content || '작성된 내용이 없습니다.'"
        :tags="[post.author, formatDate(post.updatedAt)]"
      >
        <template #actions>
          <el-button size="small" @click="startEdit(post)">수정</el-button>
          <el-button size="small" type="danger" plain @click="removePost(post)">삭제</el-button>
        </template>
      </IndexRow>
    </div>
  </el-card>

  <!-- 등록 / 수정 -->
  <el-dialog v-model="dialogVisible" :title="editingId === null ? '새 기록' : '기록 수정'" width="520px">
    <el-form :model="form" label-width="64px">
      <el-form-item label="제목">
        <el-input v-model.trim="form.title" maxlength="100" show-word-limit placeholder="오늘을 한 줄로" />
      </el-form-item>
      <el-form-item label="작성자">
        <el-input v-model.trim="form.author" maxlength="30" placeholder="비워두면 익명" />
      </el-form-item>
      <el-form-item label="내용">
        <el-input v-model.trim="form.content" type="textarea" :rows="6" maxlength="1000" show-word-limit placeholder="오늘 날씨와 하루를 적어 보세요." />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">취소</el-button>
      <el-button type="primary" :loading="isSaving" @click="submitPost">
        {{ editingId === null ? '등록' : '수정' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.section {
  margin-bottom: 16px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-head h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
}

.list-area {
  min-height: 100px;
}

/* 카드끼리 테두리를 겹쳐 표처럼 이어 붙인다 (팀 목록 스타일과 동일) */
.item {
  margin-bottom: -1px;
}

.item:hover {
  border-color: var(--hover-border);
  background: var(--bg-hover);
  position: relative;
  z-index: 1;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
}

.item h4 {
  margin: 8px 0;
  font-size: 0.98rem;
}

/* 관측 기록처럼 줄 단위 정보가 들어와도 정렬이 유지되도록 고정폭 */
.item-body {
  margin: 0 0 12px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.7;
  color: var(--text-meta);
  white-space: pre-wrap;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
</style>
