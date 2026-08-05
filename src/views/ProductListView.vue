<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { productApi } from '@/api/productApi.js'
import { systemApi } from '@/api/systemApi.js'
import DataStatus from '@/components/DataStatus.vue'
import PageHeader from '@/components/PageHeader.vue'

const products = ref([])
// 목록을 새로 불러올 때마다 1씩 올려, 상태 표시줄도 함께 갱신되게 한다
const dataVersion = ref(0)
const isLoading = ref(false)
const isSaving = ref(false)
const editingId = ref(null)
const dialogVisible = ref(false)

const filters = reactive({ q: '', category: '전체', available: false })

const emptyForm = () => ({ name: '', category: '도서', price: 0, stock: 0, description: '' })
const form = reactive(emptyForm())

/** GET /api/products — 검색어·분류·재고 조건을 쿼리스트링으로 넘긴다 */
const loadProducts = async () => {
  isLoading.value = true
  try {
    products.value = await productApi.getAll({
      q: filters.q || undefined,
      category: filters.category,
      available: filters.available ? 'true' : undefined,
    })
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

const startEdit = (product) => {
  editingId.value = product.id
  Object.assign(form, {
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    description: product.description,
  })
  dialogVisible.value = true
}

/** POST(신규) 또는 PATCH(수정) */
const submitProduct = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('상품명은 필수입니다.')
    return
  }

  isSaving.value = true
  try {
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) }

    if (editingId.value === null) {
      await productApi.create(payload)
      ElMessage.success('상품이 등록되었습니다.')
    } else {
      await productApi.update(editingId.value, payload)
      ElMessage.success('상품이 수정되었습니다.')
    }

    dialogVisible.value = false
    await loadProducts()
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    isSaving.value = false
  }
}

/** DELETE /api/products/:id */
const removeProduct = async (product) => {
  try {
    await ElMessageBox.confirm(`"${product.name}" 상품을 삭제할까요?`, '삭제 확인', {
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      type: 'warning',
    })
  } catch {
    return // 사용자가 취소한 경우
  }

  try {
    await productApi.remove(product.id)
    ElMessage.success('상품이 삭제되었습니다.')
    await loadProducts()
  } catch (err) {
    ElMessage.error(err.message)
  }
}

/** POST /api/reset — 메모리 데이터를 초기 상태로 되돌린다 */
const resetData = async () => {
  try {
    const result = await systemApi.reset()
    ElMessage.success(result.message)
    await loadProducts()
  } catch (err) {
    ElMessage.error(err.message)
  }
}

onMounted(loadProducts)
</script>

<template>
  <PageHeader
    :index="4"
    eyebrow="Kit"
    title="날씨 준비물"
    desc="날씨에 따라 챙기면 좋은 물건을 정리해 둡니다."
  >
    <template #meta>
      <span class="eyebrow">{{ products.length }}개 품목</span>
    </template>
  </PageHeader>

  <!-- 검색 및 필터 -->
  <el-card class="section" shadow="never">
    <template #header>
      <div class="section-head">
        <h3>준비물 찾기</h3>
        <DataStatus :refresh-key="dataVersion" />
      </div>
    </template>

    <el-form :inline="true" @submit.prevent="loadProducts">
      <el-form-item>
        <el-input v-model.trim="filters.q" placeholder="이름 또는 설명으로 찾기" clearable style="width: 200px" @keyup.enter="loadProducts" />
      </el-form-item>

      <el-form-item>
        <el-select v-model="filters.category" style="width: 110px">
          <el-option label="전체" value="전체" />
          <el-option label="도서" value="도서" />
          <el-option label="장비" value="장비" />
          <el-option label="기타" value="기타" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="filters.available" label="보유 중인 것만" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="isLoading" @click="loadProducts">조회</el-button>
        <el-button @click="openCreate">준비물 추가</el-button>
        <el-button @click="resetData">초기화</el-button>
      </el-form-item>
    </el-form>
  </el-card>

  <!-- 목록 -->
  <el-card class="section" shadow="never">
    <template #header>
      <div class="section-head">
        <h3>준비물 목록</h3>
      </div>
    </template>

    <el-table v-loading="isLoading" :data="products" border stripe empty-text="조건에 맞는 준비물이 없습니다.">
      <el-table-column prop="id" label="ID" width="52" />
      <el-table-column prop="name" label="이름" min-width="130" show-overflow-tooltip />
      <el-table-column prop="category" label="분류" width="70" />

      <el-table-column label="가격" width="96" align="right">
        <template #default="{ row }">
          <span class="mono">{{ row.price.toLocaleString() }}원</span>
        </template>
      </el-table-column>

      <el-table-column label="재고" width="76" align="center">
        <template #default="{ row }">
          <el-tag :type="row.stock > 0 ? 'info' : 'danger'" size="small" :effect="row.stock > 0 ? 'plain' : 'dark'">
            {{ row.stock > 0 ? `${row.stock}개` : '품절' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="description" label="설명" min-width="120" show-overflow-tooltip />

      <el-table-column label="관리" width="140" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="startEdit(row)">수정</el-button>
          <el-button size="small" type="danger" plain @click="removeProduct(row)">삭제</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <!-- 등록 / 수정 -->
  <el-dialog v-model="dialogVisible" :title="editingId === null ? '준비물 추가' : '준비물 수정'" width="480px">
    <el-form :model="form" label-width="64px">
      <el-form-item label="이름">
        <el-input v-model.trim="form.name" maxlength="60" placeholder="예: 3단 우산" />
      </el-form-item>
      <el-form-item label="분류">
        <el-select v-model="form.category" style="width: 100%">
          <el-option label="도서" value="도서" />
          <el-option label="장비" value="장비" />
          <el-option label="기타" value="기타" />
        </el-select>
      </el-form-item>
      <el-form-item label="가격">
        <el-input-number v-model="form.price" :min="0" :step="1000" />
      </el-form-item>
      <el-form-item label="재고">
        <el-input-number v-model="form.stock" :min="0" />
      </el-form-item>
      <el-form-item label="설명">
        <el-input v-model.trim="form.description" type="textarea" :rows="2" placeholder="언제 필요한지 적어 두세요" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">취소</el-button>
      <el-button type="primary" :loading="isSaving" @click="submitProduct">
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

/* 숫자는 자릿수가 흔들리지 않도록 고정폭 */
.mono {
  font-family: var(--font-mono);
  font-size: 0.8rem;
}
</style>
