<template>
  <div class="rank-page">
    <CustomNav :show-back="true" :transparent="true" />

    <div class="rank-header">
      <div class="left-block">
        <div class="header-title">排行榜</div>
        <div class="date">截止 {{ dateText }}</div>
      </div>
      <img class="rank-image" :src="rankIcon" alt="" />
    </div>

    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ active: activeTab === tab.value }"
        @click="onTabChange(tab.value)"
      >{{ tab.label }}</div>
    </div>

    <div class="content" ref="scrollRef">
      <div v-if="loading && list.length === 0" class="loading-state">
        <van-loading type="spinner" color="#FF5F15" size="32" />
      </div>

      <template v-else-if="list.length > 0">
        <!-- 人气：纵向榜单 -->
        <div v-if="activeTab === 'hot'" class="list-hot">
          <div
            v-for="(item, idx) in list"
            :key="item.id || item.characterId"
            class="hot-item"
            @click="onRoleClick(item)"
          >
            <img class="cover" :src="item.url" alt="" />
            <div class="meta">
              <div class="name">{{ item.name }}</div>
              <div class="hot-line">
                <span class="chat-count">💬 {{ formatNumber(item.chatCount) }}</span>
                <span class="heat">🔥 {{ formatNumber(item.heat) }}</span>
              </div>
              <div class="desc">{{ item.description || '' }}</div>
            </div>
            <div class="rank-badge" :class="{ top3: idx < 3 }">
              TOP {{ formatRank(idx + 1) }}
            </div>
          </div>
        </div>

        <!-- 宝藏：两列卡片网格 -->
        <div v-else class="list-grid">
          <div
            v-for="item in list"
            :key="item.id || item.characterId"
            class="grid-card"
            @click="onRoleClick(item)"
          >
            <img class="grid-cover" :src="item.url" alt="" />
            <div class="grid-info">
              <div class="grid-name">{{ item.name }}</div>
              <div v-if="activeTab === 'wow'" class="increase-box">
                <van-icon name="fire-o" color="#FF9500" size="14" />
                对话暴涨{{ item.ratioStr }}
              </div>
              <div v-else class="hot-line">
                <span class="chat-count">💬 {{ formatNumber(item.chatCount) }}</span>
                <span class="heat">🔥 {{ formatNumber(item.heat) }}</span>
              </div>
              <div class="role-tags">
                <span
                  v-for="tag in item.tagList"
                  :key="tag"
                  class="role-tag"
                >#{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loadingMore" class="loading-more">
          <van-loading type="spinner" size="20" color="#FF5F15" /> 加载中...
        </div>
        <div v-else-if="loadMoreStatus === 2" class="no-more">已加载全部</div>
      </template>

      <!-- 空状态 -->
      <div v-else-if="!loadError" class="empty-state">
        <van-icon name="info-o" size="80" color="#ccc" />
        <div class="empty-text">{{ activeTab === 'new' ? '暂无新崽，稍后再来看看' : '暂无数据' }}</div>
      </div>

      <!-- 加载失败 -->
      <div v-else class="empty-state error-state" @click="onRetryLoad">
        <van-icon name="warning-o" size="80" color="#ccc" />
        <div class="empty-text">加载失败，点击重试</div>
      </div>

      <div :style="{ height: '60px' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { getCharacterRanking, getCurrentPlotByCharacterId } from '@/api/role'

const route = useRoute()
const router = useRouter()

const rankIcon = '/static/discover/rank.png'
const tabs = [
  { value: 'hot', label: '近期人气崽' },
  { value: 'wow', label: '隐藏宝藏崽' },
  { value: 'new', label: '新崽集合站' }
]

const activeTab = ref('hot')
const dateText = ref('')
const list = ref([])
const pageNo = ref(1)
const pageSize = 10
const totalCount = ref(0)
const loading = ref(true)
const loadMoreStatus = ref(0)
const loadError = ref(false)
const loadingMore = ref(false)

const scrollRef = ref(null)
let scrollHandler = null

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}年${m}月${day}日`
}

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return String(n)
}

function formatRank(n) {
  return n < 10 ? '0' + n : String(n)
}

function onTabChange(type) {
  if (type === activeTab.value) return
  activeTab.value = type
  list.value = []
  pageNo.value = 1
  totalCount.value = 0
  loadMoreStatus.value = 0
  loading.value = true
  loadError.value = false
  loadList(true)
}

async function loadList(isRefresh = true) {
  if (isRefresh) {
    loading.value = true
    loadError.value = false
  } else {
    if (loadMoreStatus.value === 1) return
    loadingMore.value = true
    pageNo.value++
  }
  loadMoreStatus.value = 1

  try {
    const res = await getCharacterRanking({ type: activeTab.value })
    const records = (res && res.list) || []
    const mapList = records.map((item) => {
      const ratio = item.ratio || 0
      return {
        ...item,
        ratioStr: `+${Math.round(ratio * 100)}%`,
        tagList: (item.tags || '').split(',').filter(Boolean)
      }
    })
    if (isRefresh) {
      list.value = mapList
    } else {
      list.value = [...list.value, ...mapList]
    }
    totalCount.value = res.total || 0
    loadMoreStatus.value = list.value.length >= totalCount.value ? 2 : 0
    loadError.value = false
  } catch (e) {
    console.error('loadList error', e)
    loadMoreStatus.value = 3
    loadError.value = isRefresh || list.value.length === 0
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function onLoadMore() {
  if (list.value.length >= totalCount.value) return
  if (loadMoreStatus.value !== 0) return
  loadList(false)
}

function onRetryLoad() {
  if (list.value.length === 0) {
    loadList(true)
  } else if (loadMoreStatus.value === 3) {
    loadList(false)
  }
}

async function onRoleClick(item) {
  const id = item.characterId || item.id
  if (!id) return
  try {
    const res = await getCurrentPlotByCharacterId(id)
    router.push({
      path: '/pages/chat/index',
      query: {
        plotId: res && res.plotId ? res.plotId : '',
        characterId: id,
        isDiscover: 'true'
      }
    })
  } catch (e) {
    showToast('进入失败，请重试')
  }
}

function handleScroll(e) {
  const el = e.target
  if (!el) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    onLoadMore()
  }
}

onMounted(() => {
  const type = route.query.type || 'hot'
  activeTab.value = type
  dateText.value = formatDate(new Date())
  loadList(true)
  nextTick(() => {
    if (scrollRef.value) {
      scrollHandler = handleScroll
      scrollRef.value.addEventListener('scroll', scrollHandler)
    }
  })
})

onUnmounted(() => {
  if (scrollRef.value && scrollHandler) {
    scrollRef.value.removeEventListener('scroll', scrollHandler)
  }
})
</script>

<style lang="scss" scoped>
.rank-page {
  min-height: 100vh;
  background: #0a0d18;
  color: #fff;
  padding-top: 88px;
}

.rank-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 16px;
}

.left-block {
  flex: 1;
}

.header-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(90deg, #fff 0%, #a98cff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.date {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
}

.rank-image {
  width: 160px;
  height: 160px;
  object-fit: contain;
}

.tabs {
  display: flex;
  gap: 24px;
  padding: 0 32px 24px;
  overflow-x: auto;
}

.tab {
  padding: 12px 32px;
  font-size: 28px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 32px;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}

.tab.active {
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 600;
}

.content {
  min-height: calc(100vh - 88px - 100px - 100px);
  padding: 0 24px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
  color: rgba(255, 255, 255, 0.6);
}

.empty-state.error-state {
  cursor: pointer;
}

.empty-text {
  margin-top: 16px;
  font-size: 28px;
}

/* hot 列表 */
.list-hot {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
}

.hot-item {
  position: relative;
  display: flex;
  gap: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.hot-item .cover {
  width: 180px;
  height: 180px;
  border-radius: 16px;
  object-fit: cover;
  flex-shrink: 0;
}

.hot-item .meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.hot-item .name {
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-line {
  display: flex;
  gap: 16px;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
}

.hot-item .desc {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rank-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 22px;
  border-radius: 8px;

  &.top3 {
    background: linear-gradient(135deg, #667eea, #764ba2);
    font-weight: 600;
  }
}

/* 网格 */
.list-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 16px 0;
}

.grid-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.grid-cover {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.grid-info {
  padding: 16px;
}

.grid-name {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.increase-box {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 22px;
  color: #FF9500;
  margin-bottom: 8px;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-tag {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 0;
  color: rgba(255, 255, 255, 0.6);
}

.no-more {
  text-align: center;
  padding: 32px 0;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
