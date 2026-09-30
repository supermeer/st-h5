<template>
  <div class="theme-page">
    <CustomNav title="主题" :show-back="true" />

    <div class="theme-content">
      <!-- 标签页切换 -->
      <div class="tabs">
        <div
          v-for="(tab, idx) in tabs"
          :key="idx"
          class="tab"
          :class="{ active: activeTab === tab.value }"
          @click="onTabsChange(tab.value)"
        >{{ tab.label }}</div>
      </div>

      <div class="scroll-area">
        <div v-if="loading" class="loading-wrap">
          <van-loading type="spinner" color="#FF5F15" />
        </div>

        <div v-else-if="themeList.length === 0 && !loading" class="empty-wrap">
          <van-empty description="暂无主题风格" />
        </div>

        <div v-else class="theme-list">
          <div
            v-for="theme in themeList"
            :key="theme.id"
            class="theme-item"
            @click="onThemeItemClick(theme)"
          >
            <div class="theme-name">{{ theme.name }}</div>
            <div class="theme-description">{{ theme.description }}</div>
          </div>

          <div v-if="loadingMore" class="loading-more">
            <van-loading type="spinner" color="#5B00FF" size="20" />
          </div>
          <div v-else-if="loadMoreStatus === 2 && themeList.length > 0" class="no-more">
            已加载全部主题
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import CustomNav from '@/components/CustomNav.vue'

const router = useRouter()

const tabs = [
  { value: '0', label: '商务风格' },
  { value: '1', label: '创意风格' },
  { value: '2', label: '简约风格' }
]

const activeTab = ref('0')
const themeList = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const loadMoreStatus = ref(0)
let pageNo = 1
const pageSize = 10
let scrollContainer = null

// 三种分类的模拟数据
const MOCK_THEMES = [
  {
    name: '商务风格',
    list: [
      { name: '经典商务', description: '传统稳重的商务风格，适合正式会议和商务谈判' },
      { name: '现代商务', description: '融合现代元素的商务风格，简洁而专业' },
      { name: '简约商务', description: '去除繁琐装饰的商务风格，突出内容重点' },
      { name: '高端商务', description: '精致典雅的高端商务风格，彰显品牌实力' },
      { name: '传统商务', description: '经典传统的商务风格，体现企业文化底蕴' },
      { name: '国际商务', description: '国际化视野的商务风格，适合跨国企业' },
      { name: '科技商务', description: '融入科技元素的商务风格，展现创新活力' }
    ]
  },
  {
    name: '创意风格',
    list: [
      { name: '艺术创意', description: '富有艺术气息的创意风格，激发灵感与想象' },
      { name: '时尚创意', description: '紧跟潮流的时尚创意风格，展现个性魅力' },
      { name: '科技创意', description: '融合科技元素的创意风格，未来感十足' },
      { name: '年轻创意', description: '充满活力的年轻创意风格，适合年轻群体' },
      { name: '潮流创意', description: '把握潮流脉搏的创意风格，引领时代趋势' },
      { name: '插画创意', description: '手绘插画风格的创意设计，温暖有趣' },
      { name: '几何创意', description: '运用几何元素的创意风格，简洁而富有张力' }
    ]
  },
  {
    name: '简约风格',
    list: [
      { name: '极简白', description: '纯净简洁的白色主调，营造清爽空间感' },
      { name: '现代简约', description: '现代简约美学，注重功能性与美观性的平衡' },
      { name: '北欧简约', description: '北欧风格的简约设计，温馨而实用' },
      { name: '日式简约', description: '日式禅意的简约风格，宁静致远' },
      { name: '清新简约', description: '清新自然的简约风格，给人舒适感受' },
      { name: '冷色简约', description: '冷色调的简约风格，理性而专业' },
      { name: '暖色简约', description: '暖色调的简约风格，温馨而亲和' }
    ]
  }
]

function getThemeList(tabValue) {
  const cat = MOCK_THEMES[parseInt(tabValue)] || MOCK_THEMES[0]
  return (cat.list || []).map((item, idx) => ({
    id: `${tabValue}-${idx + 1}`,
    name: item.name,
    description: item.description
  }))
}

async function loadThemeList(reset = true) {
  if (reset) {
    pageNo = 1
    loading.value = true
    themeList.value = []
  } else {
    if (loadMoreStatus.value !== 0) return
    loadingMore.value = true
  }
  loadMoreStatus.value = 1

  // 模拟接口请求
  await new Promise((r) => setTimeout(r, 600))

  const all = getThemeList(activeTab.value)
  const start = (pageNo - 1) * pageSize
  const slice = all.slice(start, start + pageSize)

  if (reset) {
    themeList.value = slice
  } else {
    themeList.value = [...themeList.value, ...slice]
  }
  pageNo++

  if (themeList.value.length >= all.length) {
    loadMoreStatus.value = 2
  } else {
    loadMoreStatus.value = 0
  }
  loading.value = false
  loadingMore.value = false
}

function onTabsChange(tab) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  loadThemeList(true)
}

function onThemeItemClick(theme) {
  // 把数据回传上一页（通过 history state）
  if (window.history.state && window.history.state.fromBlog) {
    history.replaceState(
      { ...history.state, selectedTheme: theme },
      ''
    )
  }
  router.back()
}

function onScroll(e) {
  const el = e.target
  if (!el) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    if (loadMoreStatus.value === 0 && !loadingMore.value) {
      loadThemeList(false)
    }
  }
}

onMounted(() => {
  loadThemeList(true)
  nextTick(() => {
    scrollContainer = document.querySelector('.scroll-area')
    if (scrollContainer) scrollContainer.addEventListener('scroll', onScroll)
  })
})

onUnmounted(() => {
  if (scrollContainer) scrollContainer.removeEventListener('scroll', onScroll)
})
</script>

<style lang="scss" scoped>
.theme-page {
  min-height: 100vh;
  background: #1a1a1a
    url('https://yoursx-static-1371529546.cos.ap-guangzhou.myqcloud.com/page_bg_1.png') center/cover no-repeat;
  padding-top: 88px;
}

.theme-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 88px);
}

.tabs {
  display: flex;
  gap: 24px;
  padding: 24px 32px 16px;
  background: transparent;
}

.tab {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.6);
  padding: 8px 24px;
  border-radius: 24px;
  cursor: pointer;

  &.active {
    color: #fff;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    font-weight: 600;
  }
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 32px 32px;
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
  padding-top: 16px;
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

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
}

.no-more {
  text-align: center;
  padding: 32px 0;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
