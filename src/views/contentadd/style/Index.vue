<template>
  <div class="theme-page">
    <CustomNav title="风格" :show-back="true" />

    <div class="scroll-area">
      <div v-if="loading" class="loading-wrap">
        <van-loading type="spinner" color="#FF5F15" />
      </div>

      <div v-else-if="styleList.length === 0 && !loading" class="empty-wrap">
        <van-empty description="暂无数据" />
      </div>

      <div v-else class="theme-list">
        <div
          v-for="style in styleList"
          :key="style.id"
          class="theme-item"
          @click="onStyleItemClick(style)"
        >
          <div class="theme-name">{{ style.name }}</div>
          <div class="theme-description">{{ style.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { getStyleList } from '@/api/ai/chat'

const router = useRouter()

const styleList = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getStyleList()
    const items = Array.isArray(res)
      ? res
      : res?.list || res?.items || res?.records || res?.data || []
    styleList.value = items
  } catch (e) {
    showToast('加载失败')
    styleList.value = []
  } finally {
    loading.value = false
  }
})

function onStyleItemClick(style) {
  // 通过 history state 回传给上一页
  const fromState = window.history.state || {}
  if (fromState.fromBlog) {
    history.replaceState(
      { ...fromState, selectedStyle: style },
      ''
    )
  }
  router.back()
}
</script>

<style lang="scss" scoped>
.theme-page {
  min-height: 100vh;
  background: #1a1a1a
    url('https://yoursx-static-1371529546.cos.ap-guangzhou.myqcloud.com/page_bg_1.png') center/cover no-repeat;
  padding-top: 88px;
}

.scroll-area {
  min-height: calc(100vh - 88px);
  padding: 32px;
  overflow-y: auto;
}

.loading-wrap,
.empty-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
  color: rgba(255, 255, 255, 0.6);
}

.theme-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.theme-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 32px;
  cursor: pointer;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.theme-name {
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
}

.theme-description {
  font-size: 26px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}
</style>
