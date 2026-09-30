<template>
  <div class="role-select-page">
    <CustomNav title="选择角色" :show-back="true" />

    <div class="page-content">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <van-search
          v-if="showSearchInput"
          v-model="searchKeyword"
          placeholder="搜索角色"
          :show-action="false"
          @clear="onClearSearch"
          @change="onSearchInput"
          @search="onSearchConfirm"
        />
        <div v-else class="search-placeholder" @click="onToggleSearch">
          <van-icon name="search" />
          <span>搜索角色</span>
        </div>
        <div v-if="showSearchInput" class="search-close" @click="onToggleSearch">
          取消
        </div>
      </div>

      <!-- 标签筛选 -->
      <div class="filter-bar">
        <div class="filter-scroll">
          <div class="filter-tags">
            <div 
              v-for="tag in tagList" 
              :key="tag"
              class="filter-tag"
              :class="{ active: activeTags.includes(tag) }"
              @click="onTagChange(tag)"
            >
              {{ tag }}
            </div>
          </div>
        </div>
      </div>

      <!-- 标签页 -->
      <div class="tabs-bar">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="onTabChange(tab.key)"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- 已选角色 -->
      <div v-if="selectedRoles.length" class="selected-bar">
        <div class="selected-scroll">
          <div 
            v-for="role in selectedRoles" 
            :key="role.id"
            class="selected-item"
            @click="onRoleClick(role)"
          >
            <img class="selected-avatar" :src="role.avatarUrl" alt="">
            <van-icon name="check" class="selected-check" />
          </div>
        </div>
      </div>

      <!-- 角色列表 -->
      <div class="role-list" ref="listRef">
        <div v-if="listIsEmpty" class="empty-state">
          <img class="empty-image" :src="emptyImage" alt="">
          <p class="empty-text">暂无角色</p>
        </div>

        <div 
          v-for="role in roleList" 
          :key="role.id"
          class="role-item"
          :class="{ selected: role._selected }"
          @click="onRoleClick(role)"
        >
          <img class="role-avatar" :src="role.avatarUrl || role.backgroundImage" alt="">
          <div class="role-info">
            <div class="role-name">{{ role.name }}</div>
            <div class="role-desc">{{ role.description }}</div>
          </div>
          <van-icon 
            v-if="role._selected" 
            name="check-circle" 
            class="role-check"
            color="#FF5F15"
          />
        </div>

        <!-- 加载更多 -->
        <div v-if="loadMoreStatus === 1" class="loading-more">
          <van-loading type="spinner" size="24px" color="#5B00FF" />
        </div>
        <div v-if="loadMoreStatus === 2 && roleList.length" class="no-more">
          已加载全部
        </div>
        <div v-if="loadMoreStatus === 3" class="load-fail" @click="onRetryLoad">
          加载失败，点击重试
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <div class="selected-count">
        已选择 <span class="count">{{ selectedRoles.length }}</span> / 9
      </div>
      <van-button 
        type="primary" 
        block 
        round
        @click="onSave"
      >
        确定
      </van-button>
    </div>

    <van-toast id="van-toast" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'vant/lib/toast'
import CustomNav from '@/components/CustomNav.vue'
import { getCharacterTag, getCharacterList } from '@/api/role'

const route = useRoute()
const router = useRouter()

const listRef = ref(null)

const activeTab = ref('system')
const tabs = [
  { key: 'system', name: '星语角色' },
  { key: 'my', name: '我的角色' }
]

const tagList = ref([])
const activeTags = ref([])
const searchKeyword = ref('')
const showSearchInput = ref(false)

const roleList = ref([])
const selectedRoles = ref([])

const loadMoreStatus = ref(0) // 0-待加载, 1-加载中, 2-已全部加载, 3-加载失败
const listIsEmpty = ref(false)
const pageNo = ref(1)
const pageSize = 20
const totalCount = ref(0)

const emptyImage = '/static/images/empty.png'

onMounted(() => {
  // 存储上一页引用
  window.__prevPage = router.currentRoute.value.meta?.prevPage

  if (route.query.selectedRoles) {
    try {
      const roles = JSON.parse(decodeURIComponent(route.query.selectedRoles))
      selectedRoles.value = roles
    } catch (e) {
      console.error('解析已选角色失败', e)
    }
  }

  loadCharacterTag()
  loadSystemRoles()
})

function loadCharacterTag() {
  getCharacterTag().then(res => {
    tagList.value = res || []
  }).catch(err => {
    console.error('获取标签失败', err)
  })
}

function loadSystemRoles() {
  pageNo.value = 1
  loadRoleList(true, 'system')
}

function loadMyRoles() {
  pageNo.value = 1
  loadRoleList(true, 'my')
}

function onTabChange(key) {
  if (key === activeTab.value) return

  activeTab.value = key
  roleList.value = []
  loadMoreStatus.value = 0

  if (key === 'system') {
    loadSystemRoles()
  } else {
    loadMyRoles()
  }
}

function onToggleSearch() {
  showSearchInput.value = !showSearchInput.value

  if (!showSearchInput.value) {
    searchKeyword.value = ''
    loadRoleList(true)
  }
}

function onSearchInput() {
  // 实时搜索
}

function onSearchConfirm() {
  roleList.value = []
  loadMoreStatus.value = 0
  pageNo.value = 1
  loadRoleList(true)
}

function onClearSearch() {
  searchKeyword.value = ''
  roleList.value = []
  loadMoreStatus.value = 0
  pageNo.value = 1
  loadRoleList(true)
}

function onTagChange(value) {
  const index = activeTags.value.indexOf(value)
  if (index > -1) {
    activeTags.value.splice(index, 1)
  } else {
    activeTags.value.push(value)
  }

  roleList.value = []
  loadMoreStatus.value = 0
  pageNo.value = 1
  loadRoleList(true)
}

function onRoleClick(role) {
  const existIndex = selectedRoles.value.findIndex(item => item.id === role.id)

  if (existIndex > -1) {
    selectedRoles.value.splice(existIndex, 1)
  } else {
    if (selectedRoles.value.length >= 9) {
      Toast({
        message: '最多选择9个角色',
        icon: 'none'
      })
      return
    }
    selectedRoles.value.push({
      ...role,
      avatarUrl: role.avatarUrl || role.backgroundImage || ''
    })
  }

  // 更新列表选中状态
  roleList.value = roleList.value.map(item => {
    if (item.id === role.id) {
      return { ...item, _selected: existIndex > -1 ? false : true }
    }
    return item
  })
}

function onLoadMore() {
  if (roleList.value.length >= totalCount.value) {
    loadMoreStatus.value = 2
    return
  }

  if (loadMoreStatus.value !== 0) return

  loadRoleList(false)
}

function onRetryLoad() {
  if (loadMoreStatus.value === 3) {
    loadRoleList(false)
  }
}

async function loadRoleList(isRefresh = false, type = null) {
  const tabType = type || activeTab.value

  if (isRefresh) {
    pageNo.value = 1
  } else {
    pageNo.value = pageNo.value + 1
  }

  loadMoreStatus.value = 1

  try {
    const params = {
      current: pageNo.value,
      size: pageSize,
      sortOrder: 'desc',
      sortField: 'browseCount',
      characterTagIds: activeTags.value.join(','),
    }

    if (tabType === 'system') {
      params.ifSystem = true
    } else {
      params.ifSystem = false
    }

    if (searchKeyword.value) {
      params.name = searchKeyword.value
    }

    const res = await getCharacterList(params)

    const newList = (res.records || []).map(item => {
      const isSelected = selectedRoles.value.some(s => s.id === item.id)
      return { ...item, _selected: isSelected }
    })

    const finalList = isRefresh ? newList : [...roleList.value, ...newList]

    roleList.value = finalList
    totalCount.value = res.total || 0
    loadMoreStatus.value = finalList.length >= (res.total || 0) ? 2 : 0
    listIsEmpty.value = finalList.length === 0
  } catch (error) {
    console.error('加载角色列表失败:', error)
    loadMoreStatus.value = 3
    Toast({
      message: '加载失败，请重试',
      icon: 'none'
    })
  }
}

// 监听滚动
function handleScroll() {
  const el = listRef.value
  if (!el) return
  
  const { scrollTop, scrollHeight, clientHeight } = el
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    onLoadMore()
  }
}

onMounted(() => {
  if (listRef.value) {
    listRef.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (listRef.value) {
    listRef.value.removeEventListener('scroll', handleScroll)
  }
})

function onSave() {
  // 调用上一页的方法
  const prevPage = window.__prevPage
  if (prevPage && typeof prevPage.onRoleSelectBack === 'function') {
    prevPage.onRoleSelectBack(selectedRoles.value)
  }
  router.back()
}
</script>

<style lang="scss" scoped>
.role-select-page {
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  padding-top: 88px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  gap: 16rpx;
}

.search-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 40rpx;
  color: rgba(255, 255, 255, 0.5);
  font-size: 28rpx;
  cursor: pointer;
}

.search-close {
  font-size: 28rpx;
  color: #FF5F15;
  cursor: pointer;
}

.filter-bar {
  padding: 0 24rpx 16rpx;
}

.filter-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-tags {
  display: flex;
  gap: 16rpx;
}

.filter-tag {
  flex-shrink: 0;
  padding: 12rpx 28rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  
  &.active {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    color: #fff;
  }
}

.tabs-bar {
  display: flex;
  padding: 0 24rpx;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-item {
  padding: 24rpx 32rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  
  &.active {
    color: #fff;
    font-weight: 600;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background: linear-gradient(135deg, #FF5F15, #FF9500);
      border-radius: 2rpx;
    }
  }
}

.selected-bar {
  padding: 16rpx 24rpx;
  background: rgba(255, 255, 255, 0.05);
}

.selected-scroll {
  display: flex;
  gap: 20rpx;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.selected-item {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  
  .selected-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    border: 4rpx solid #FF5F15;
  }
  
  .selected-check {
    position: absolute;
    bottom: -4rpx;
    right: -4rpx;
    width: 32rpx;
    height: 32rpx;
    background: #FF5F15;
    border-radius: 50%;
    color: #fff;
    font-size: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.role-list {
  flex: 1;
  overflow-y: auto;
  padding: 16rpx 24rpx;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 32rpx;
    opacity: 0.5;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.6);
  }
}

.role-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
  cursor: pointer;
  
  &.selected {
    border-color: #FF5F15;
    background: rgba(255, 95, 21, 0.1);
  }
}

.role-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.role-info {
  flex: 1;
  overflow: hidden;
}

.role-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;
}

.role-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-check {
  margin-left: 16rpx;
  font-size: 40rpx;
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 32rpx;
  color: rgba(255, 255, 255, 0.6);
}

.no-more {
  text-align: center;
  padding: 32rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
}

.load-fail {
  text-align: center;
  padding: 32rpx;
  font-size: 24rpx;
  color: #FF5F15;
  cursor: pointer;
}

.bottom-bar {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  padding-bottom: calc(24rpx + var(--safearea-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 50;
}

.selected-count {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  
  .count {
    color: #FF5F15;
    font-weight: 600;
  }
}

.bottom-bar .van-button {
  flex: 1;
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border: none;
}
</style>
