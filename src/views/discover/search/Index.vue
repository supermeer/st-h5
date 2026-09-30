<template>
  <div class="search-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <van-icon name="search" class="search-icon" />
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="搜索内容"
          @input="onKeywordChange"
          @keydown.enter="onSearch"
          ref="inputRef"
        />
        <van-icon
          v-if="keyword"
          name="clear"
          class="clear-icon"
          @click="onClearKeyword"
        />
      </div>
      <div class="cancel-btn" @click="onCancel">取消</div>
    </div>

    <!-- 默认状态：历史搜索和热门搜索 -->
    <div v-if="searchStatus === 'default'" class="content-scroll">
      <!-- 历史搜索 -->
      <div v-if="historyList.length" class="history-section">
        <div class="section-header">
          <span class="section-title">历史搜索</span>
          <span class="clear-btn" @click="onShowClearDialog">
            <van-icon name="delete-o" size="14" />
          </span>
        </div>
        <div class="keyword-list">
          <span
            v-for="(item, idx) in historyList"
            :key="idx"
            class="keyword-item"
            @click="onHistoryClick(item)"
          >{{ item }}</span>
        </div>
      </div>

      <!-- 热门搜索 -->
      <div v-if="hotList.length" class="hot-section">
        <div class="section-header">
          <span class="section-title">热门搜索</span>
        </div>
        <div class="keyword-list">
          <span
            v-for="(item, idx) in hotList"
            :key="idx"
            class="keyword-item hot"
            @click="onHotClick(item)"
          >
            <van-icon v-if="idx < 3" name="fire-o" color="#FF6B6B" size="12" />
            {{ item }}
          </span>
        </div>
      </div>

      <!-- 近期人气崽 -->
      <div v-if="preview.hot.length" class="rank-preview">
        <div class="section-header">
          <span class="section-title">
            <img class="section-title-icon" src="/static/discover/rank-icon.png" alt="" />
            近期人气崽
          </span>
          <span class="see-all" @click="gotoRank('hot')">完整榜单</span>
        </div>
        <div class="h-scroll">
          <div
            v-for="(item, idx) in preview.hot"
            :key="item.id || idx"
            class="role-card"
            :style="{ backgroundImage: `url(${item.url})` }"
            @click="onRoleClick(item)"
          >
            <div class="rank-badge" :class="{ top3: idx < 3 }">
              TOP {{ formatRank(idx + 1) }}
            </div>
            <div class="role-info">
              <div class="role-name-row">
                <span class="role-name">{{ item.name }}</span>
              </div>
              <div class="hot-line">
                <span>💬 {{ formatNumber(item.chatCount) }}</span>
                <span>🔥 {{ formatNumber(item.heat) }}</span>
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
      </div>

      <!-- 隐藏宝藏崽 -->
      <div v-if="preview.wow.length" class="rank-preview">
        <div class="section-header">
          <span class="section-title">
            <img class="section-title-icon" src="/static/discover/rank-icon.png" alt="" />
            隐藏宝藏崽
          </span>
          <span class="see-all" @click="gotoRank('wow')">完整榜单</span>
        </div>
        <div class="h-scroll">
          <div
            v-for="item in preview.wow"
            :key="item.id"
            class="role-card"
            :style="{ backgroundImage: `url(${item.url})` }"
            @click="onRoleClick(item)"
          >
            <div class="role-info">
              <div class="role-name-row">
                <span class="role-name">{{ item.name }}</span>
              </div>
              <div class="increase-box">
                <van-icon name="fire-o" color="#FF9500" size="12" />
                对话暴涨{{ item.ratioStr }}
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
      </div>

      <!-- 新崽集合站 -->
      <div v-if="preview.new.length" class="rank-preview">
        <div class="section-header">
          <span class="section-title">
            <img class="section-title-icon" src="/static/discover/rank-icon.png" alt="" />
            新崽集合站
          </span>
          <span class="see-all" @click="gotoRank('new')">完整榜单</span>
        </div>
        <div class="h-scroll">
          <div
            v-for="item in preview.new"
            :key="item.id"
            class="role-card"
            :style="{ backgroundImage: `url(${item.url})` }"
            @click="onRoleClick(item)"
          >
            <div class="role-info">
              <div class="role-name-row">
                <span class="role-name">{{ item.name }}</span>
              </div>
              <div class="hot-line">
                <span>💬 {{ formatNumber(item.chatCount) }}</span>
                <span>🔥 {{ formatNumber(item.heat) }}</span>
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
      </div>

      <div :style="{ height: '60px' }"></div>
    </div>

    <!-- 搜索结果状态 -->
    <div v-else class="content-scroll">
      <!-- 搜索加载中 -->
      <div v-if="searching" class="loading-wrap">
        <van-loading type="spinner" color="#FF5F15" size="32" />
        <span>正在搜索...</span>
      </div>

      <!-- 搜索结果列表 -->
      <template v-if="!searching && roleList.length > 0">
        <div class="result-header">
          <span class="result-count">找到 {{ totalCount }} 个相关结果</span>
        </div>
        <div class="role-list">
          <div
            v-for="role in roleList"
            :key="role.id"
            class="role-card"
            :style="{ backgroundImage: `url(${role.backgroundImage})` }"
            @click="onRoleClick(role)"
          >
            <div class="role-info">
              <div class="role-name-row">
                <span class="role-name">{{ role.name }}</span>
                <van-icon
                  v-if="role.verified"
                  name="success"
                  color="#4A9EFF"
                  size="14"
                />
              </div>
              <div class="hot-line">
                <span>💬 {{ formatNumber(role.messageCount) }}</span>
                <span>🔥 {{ formatNumber(role.heat || role.browseCount) }}</span>
              </div>
              <div class="role-tags">
                <span
                  v-for="tag in role.tagNames || []"
                  :key="tag"
                  class="role-tag"
                >#{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loadingMore" class="loading-more">
          <van-loading type="spinner" size="20" color="#5B00FF" />
        </div>
        <div v-else-if="loadMoreStatus === 2" class="no-more">已加载全部</div>
      </template>

      <!-- 空态 -->
      <div v-if="!searching && listIsEmpty" class="empty-container">
        <van-icon name="search" size="80" color="#666" />
        <div class="empty-text">未找到"{{ currentSearchKeyword }}"相关内容</div>
        <div class="empty-tip">换个关键词试试吧</div>
      </div>

      <div :style="{ height: '60px' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import {
  getCharacterList,
  getCurrentPlotByCharacterId,
  getHotSearchKeywords,
  getCharacterRanking
} from '@/api/role'

const route = useRoute()
const router = useRouter()

const HISTORY_KEY = 'search_history'
const MAX_HISTORY = 10

const inputRef = ref(null)
const keyword = ref('')
const historyList = ref([])
const hotList = ref([])
const roleList = ref([])
const listIsEmpty = ref(false)
const searching = ref(false)
const currentSearchKeyword = ref('')
const pageNo = ref(1)
const pageSize = 10
const totalCount = ref(0)
const loadMoreStatus = ref(0)
const loadingMore = ref(false)

const preview = reactive({
  hot: [],
  wow: [],
  new: []
})

const searchStatus = ref('default')

let scrollHandler = null
let scrollRef = null

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return String(n)
}

function formatRank(n) {
  return n < 10 ? '0' + n : String(n)
}

onMounted(() => {
  loadHistory()
  loadHot()
  loadPreviews()

  if (route.query.keyword) {
    keyword.value = route.query.keyword
    onSearch()
  }
  nextTick(() => {
    inputRef.value && inputRef.value.focus && inputRef.value.focus()
  })
})

function loadHistory() {
  try {
    const historyStr = localStorage.getItem(HISTORY_KEY)
    historyList.value = historyStr ? JSON.parse(historyStr) : []
  } catch (e) {
    historyList.value = []
  }
}

function saveHistory(kw) {
  if (!kw || !kw.trim()) return
  const trimmed = kw.trim()
  let list = [...historyList.value]
  const idx = list.indexOf(trimmed)
  if (idx > -1) list.splice(idx, 1)
  list.unshift(trimmed)
  if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY)
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
    historyList.value = list
  } catch (e) {
    console.error('保存历史失败', e)
  }
}

async function loadHot() {
  try {
    const res = await getHotSearchKeywords()
    hotList.value = res || []
  } catch (e) {
    hotList.value = []
  }
}

async function loadPreviews() {
  try {
    const [hotRes, wowRes, newRes] = await Promise.all([
      getCharacterRanking({ type: 'hot' }),
      getCharacterRanking({ type: 'wow' }),
      getCharacterRanking({ type: 'new' })
    ])
    const mapList = (list) =>
      (list || []).map((item) => {
        const ratio = item.ratio || 0
        return {
          ...item,
          ratioStr: `+${Math.round(ratio * 100)}%`,
          tagList: (item.tags || '').split(',').filter(Boolean)
        }
      })
    preview.hot = mapList((hotRes && hotRes.list) || [])
    preview.wow = mapList((wowRes && wowRes.list) || [])
    preview.new = mapList((newRes && newRes.list) || [])
  } catch (e) {
    console.warn('加载榜单预览失败', e)
  }
}

function onKeywordChange() {
  // 实时响应（如需实时搜索可在这里实现）
}

function onSearch() {
  const kw = keyword.value.trim()
  if (!kw) {
    showToast('请输入搜索内容')
    return
  }
  saveHistory(kw)
  searchStatus.value = 'result'
  pageNo.value = 1
  roleList.value = []
  listIsEmpty.value = false
  loadRoleList(true)
}

function onHistoryClick(item) {
  keyword.value = item
  onSearch()
}

function onHotClick(item) {
  keyword.value = item
  onSearch()
}

function onClearKeyword() {
  keyword.value = ''
  searchStatus.value = 'default'
  roleList.value = []
  listIsEmpty.value = false
  currentSearchKeyword.value = ''
  pageNo.value = 1
  nextTick(() => {
    inputRef.value && inputRef.value.focus && inputRef.value.focus()
  })
}

function onCancel() {
  router.back()
}

function onShowClearDialog() {
  if (window.confirm('确定要清空所有历史搜索记录吗？')) {
    localStorage.removeItem(HISTORY_KEY)
    historyList.value = []
    showToast('已清空历史记录')
  }
}

async function loadRoleList(isRefresh = false) {
  if (isRefresh) {
    pageNo.value = 1
    searching.value = true
  } else {
    if (loadMoreStatus.value === 2 || roleList.value.length >= totalCount.value) return
    pageNo.value++
  }
  loadMoreStatus.value = 1

  try {
    const params = {
      current: pageNo.value,
      size: pageSize,
      ifSystem: true,
      characterName: currentSearchKeyword.value || keyword.value.trim()
    }
    const res = await getCharacterList(params)
    const newList = res.records || []
    if (isRefresh) {
      roleList.value = newList
    } else {
      roleList.value = [...roleList.value, ...newList]
    }
    totalCount.value = res.total || 0
    listIsEmpty.value = roleList.value.length === 0
    loadMoreStatus.value = roleList.value.length >= totalCount.value ? 2 : 0
  } catch (e) {
    console.error('搜索失败', e)
    loadMoreStatus.value = 3
    showToast('加载失败，请重试')
  } finally {
    searching.value = false
    loadingMore.value = false
  }
}

function onLoadMore() {
  if (loadMoreStatus.value !== 0) return
  loadingMore.value = true
  loadRoleList(false)
}

async function onRoleClick(item) {
  const id = item.id || item.characterId
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
    console.error('进入角色失败', e)
    showToast('进入失败，请重试')
  }
}

function gotoRank(type) {
  router.push({ path: '/pages/discover/rank/index', query: { type } })
}

function handleScroll(e) {
  const el = e.target
  if (!el) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    if (loadMoreStatus.value === 0 && !loadingMore.value) {
      onLoadMore()
    }
  }
}

onUnmounted(() => {
  if (scrollRef && scrollHandler) {
    scrollRef.removeEventListener('scroll', scrollHandler)
  }
})
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background: #1a1a1a;
  color: #fff;
}

.search-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  padding-top: calc(16px + var(--safearea-top));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 100;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 40px;
}

.search-icon {
  color: rgba(255, 255, 255, 0.5);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 28px;
  color: #fff;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.clear-icon {
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.cancel-btn {
  font-size: 28px;
  color: #FF5F15;
  cursor: pointer;
  flex-shrink: 0;
}

.content-scroll {
  padding: 100px 24px 24px;
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
}

.history-section,
.hot-section,
.rank-preview {
  padding: 24px 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title-icon {
  width: 32px;
  height: 32px;
}

.see-all {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.clear-btn {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.keyword-item {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  font-size: 26px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.keyword-item.hot {
  background: rgba(255, 107, 107, 0.1);
  color: #FFCBCB;
}

.h-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.role-card {
  position: relative;
  flex-shrink: 0;
  width: 280px;
  aspect-ratio: 0.65;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.rank-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 20px;
  border-radius: 8px;
  z-index: 2;
}

.rank-badge.top3 {
  background: linear-gradient(135deg, #667eea, #764ba2);
  font-weight: 600;
}

.role-info {
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
}

.role-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.role-name {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-line {
  display: flex;
  gap: 16px;
  font-size: 22px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
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
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 搜索结果 */
.result-header {
  padding: 16px 0;
}

.result-count {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
}

.role-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.role-list .role-card {
  width: 100%;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 0;
  color: rgba(255, 255, 255, 0.6);
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120px 0;
  color: rgba(255, 255, 255, 0.6);

  .empty-text {
    margin-top: 16px;
    font-size: 28px;
  }

  .empty-tip {
    margin-top: 8px;
    font-size: 24px;
    color: rgba(255, 255, 255, 0.4);
  }
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
