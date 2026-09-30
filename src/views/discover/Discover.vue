<template>
  <div class="discover-page">
    <!-- 自定义导航栏 -->
    <CustomNav :show-back="false" :show-left-logo="false" :custom-left="true" :show-home="false" :transparent="true">
      <template #center>
        <img class="discover-nav-img" src="/static/discover/discover_nav.jpg" alt="" />
      </template>
      <template #left>
        <img class="rank-enter" src="/static/discover/rank-enter-icon.png" alt="" @click="onRank" />
      </template>
    </CustomNav>

    <!-- 顶部导航标签 -->
    <div class="top-nav">
      <div class="nav-scroll" ref="navScrollRef" @scroll="onNavScroll">
        <div class="nav-tabs">
          <div
            v-for="(item, idx) in navList"
            :key="item.id"
            class="nav-tab"
            :class="{ active: activeNav === item.id }"
            :ref="(el) => setNavTabRef(el, idx)"
            @click="onNavChange(item.id, idx)"
          >
            {{ item.name }}
            <div v-if="item.id === 'group' && showGroupRedDot" class="nav-red-dot"></div>
            <div v-if="activeNav === item.id" class="nav-underline"></div>
          </div>
        </div>
      </div>
      <div class="search-icon" @click="onSearch">
        <van-icon name="search" color="#fff" size="20" />
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tags">
      <van-dropdown-menu active-color="#1989fa">
        <van-dropdown-item v-model="sortField" :options="orderOptions" @change="onOrderChange" />
      </van-dropdown-menu>
      <div class="tags-scroll" ref="tagScrollRef" @scroll="onTagScroll">
        <span
          v-for="(item, idx) in tagList"
          :key="item.id"
          class="tag-item"
          :class="{ active: activeTags.includes(item.id) }"
          :ref="(el) => setTagItemRef(el, idx)"
          @click="onTagChange(item.id, idx)"
        >#{{ item.name }}</span>
      </div>
    </div>

    <!-- 角色列表 -->
    <div class="content-scroll" ref="contentScrollRef" @scroll="onScroll">
      <!-- 角色卡片列表 -->
      <div class="role-list">
        <!-- 顶部 swiper 活动 -->
        <div v-if="showSwiper" class="role-card role-card_active">
          <van-swipe :autoplay="activeForm.autoplay" :interval="activeForm.interval" indicator-color="#fff" @change="onActiveChange">
            <van-swipe-item
              v-for="(item, idx) in activeForm.list"
              :key="idx"
              @click="onActivityClick"
            >
              <img class="role-swiper-content" :src="item.url" alt="" />
            </van-swipe-item>
          </van-swipe>
        </div>

        <!-- 角色 -->
        <div
          v-if="activeNav !== 'group'"
          v-for="role in roleList"
          :key="role.id"
          class="role-card"
          :style="{ backgroundImage: showBG ? `url(${role.backgroundImage})` : 'none' }"
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
            <div class="role-hot-line">
              <span>💬 {{ formatNumber(role.messageCount) }}</span>
              <span>🔥 {{ formatNumber(role.browseCount) }}</span>
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

        <!-- 群聊 -->
        <div v-if="activeNav === 'group'" class="group-list">
          <div
            v-for="group in groupList"
            :key="group.groupChatId"
            class="group-card"
            @click="onGroupClick(group)"
          >
            <!-- 群成员头像列表 -->
            <div class="group-members">
              <div
                v-for="(member, idx) in (group.avatarUrls || []).slice(0, 4)"
                :key="idx"
                class="member-avatar"
                :style="{ zIndex: idx }"
              >
                <img class="member-avatar-img" :src="member" alt="" />
              </div>
            </div>

            <div class="group-info">
              <div class="group-name-row">
                <span class="group-name">{{ group.name }}</span>
              </div>
              <span class="group-desc">{{ group.description || '暂无简介' }}</span>
            </div>

            <div class="group-footer">
              <span>💬 {{ formatNumber(group.chatCount) }}</span>
              <span>🔥 {{ formatNumber(group.heat) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="loading" class="loading-more">
        <van-loading type="spinner" size="20" color="#5B00FF" />
      </div>
      <div v-else-if="loadMoreStatus === 2 && (roleList.length > 0 || groupList.length > 0)" class="no-more">
        超多角色正快马赶来，不负期待✨
      </div>
      <div v-else-if="listIsEmpty && (pageNo > 1 || hasLoaded)" class="empty-state">
        <van-empty description="暂无内容" />
      </div>

      <div :style="{ height: '160px' }"></div>
    </div>

    <!-- 折扣弹窗 -->
    <van-overlay :show="discountForm.visible" @click="discountOverlayClick">
      <div class="discount-overlay">
        <img
          :src="discountForm.picUrl"
          alt=""
          class="discount-img"
          @click="handleDiscountClick"
        />
      </div>
    </van-overlay>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { getCharacterType, getCharacterTag, getCharacterList, getCurrentPlotByCharacterId } from '@/api/role'
import { getUserGroupChatList, getCurrentPlotByGroupChatId } from '@/api/group'
import { isSpringFestivalExpired, getActivity, getGlobalModelId, getModelList } from '@/api/usercenter'
import { createPlot } from '@/api/ai/chat'

const router = useRouter()

const navList = ref([])
const activeNav = ref('')
const showSwiper = ref(false)
const showGroupRedDot = ref(true)
const navScrollRef = ref(null)
const navTabRefs = ref([])

const sortField = ref('browseCount')
const sortOrder = ref('desc')
const orderOptions = [
  { value: 'browseCount', text: '热门排序' },
  { value: 'publishTime', text: '最新排序' }
]

const tagList = ref([])
const activeTags = ref([])
const tagScrollRef = ref(null)
const tagItemRefs = ref([])

const activeForm = reactive({
  list: [
    { url: 'https://character-static-1371529546.cos.ap-guangzhou.myqcloud.com/SpringFestival_26/invite.jpg', type: 'invite' }
  ],
  autoplay: true
})

const roleList = ref([])
const groupList = ref([])
const pageNo = ref(1)
const pageSize = 10
const totalCount = ref(0)
const loadMoreStatus = ref(0)
const listIsEmpty = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const isScrollTop = ref(true)
const hasLoaded = ref(false)

const contentScrollRef = ref(null)

const discountForm = reactive({
  visible: false,
  picUrl: 'https://character-static-1371529546.cos.ap-guangzhou.myqcloud.com/SpringFestival_26/gemini_activity.png'
})

const showBG = ref(true)

function setNavTabRef(el, idx) {
  if (el) navTabRefs.value[idx] = el
}

function setTagItemRef(el, idx) {
  if (el) tagItemRefs.value[idx] = el
}

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return String(n)
}

function onNavScroll() {}

function onTagScroll() {}

onMounted(async () => {
  // 检查 aE 设置
  const aE = localStorage.getItem('aE')
  if (aE === '0') {
    showBG.value = false
  }

  await Promise.all([getCharacterType(), getCharacterTag()])
  await getSpringFestivalExpired()
  await checkGroupRedDot()
})

async function getSpringFestivalExpired() {
  try {
    const res = await isSpringFestivalExpired()
    if (!res && showBG.value) {
      const list = [
        {
          url: 'https://character-static-1371529546.cos.ap-guangzhou.myqcloud.com/SpringFestival_26/banner_1.jpg',
          type: 'discount'
        },
        {
          url: 'https://character-static-1371529546.cos.ap-guangzhou.myqcloud.com/SpringFestival_26/banner_2.jpg',
          type: 'point'
        },
        {
          url: 'https://character-static-1371529546.cos.ap-guangzhou.myqcloud.com/SpringFestival_26/banner_3.jpg',
          type: 'vip'
        },
        ...activeForm.list
      ]
      activeForm.list = list
    }
  } catch (e) {
    console.warn('检查春节活动失败', e)
  }
}

async function getCharacterTypeData() {
  try {
    const res = await getCharacterType()
    const list = [...res.slice(0, 1), { id: 'group', name: '群聊' }, ...res.slice(1)]
    navList.value = list
    if (res && res.length > 0 && !activeNav.value) {
      activeNav.value = res[0].id
      showSwiper.value = true
      pageNo.value = 1
      await loadRoleList(true)
    } else {
      updateShowSwiper()
    }
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

async function getCharacterTagData() {
  try {
    const res = await getCharacterTag()
    tagList.value = res
  } catch (e) {
    console.error('加载标签失败', e)
  }
}

function checkGroupRedDot() {
  const hasSeenGroup = localStorage.getItem('hasSeenGroup')
  if (hasSeenGroup) {
    showGroupRedDot.value = false
  }
  return getCharacterTypeData().then(() => getCharacterTagData())
}

function updateShowSwiper() {
  const firstNavId = navList.value && navList.value.length > 0 ? navList.value[0].id : ''
  const show = !!firstNavId && activeNav.value === firstNavId && activeNav.value !== 'group'
  if (showSwiper.value !== show) {
    showSwiper.value = show
  }
}

async function onNavChange(value, index) {
  if (value === activeNav.value) return
  if (value === 'group') {
    showGroupRedDot.value = false
    localStorage.setItem('hasSeenGroup', 'true')
  }
  activeNav.value = value
  roleList.value = []
  groupList.value = []
  loadMoreStatus.value = 0
  updateShowSwiper()
  pageNo.value = 1

  if (value === 'group') {
    await loadGroupList(true)
  } else {
    await loadRoleList(true)
  }
  scrollToNavTab(index)
}

function scrollToNavTab(index) {
  setTimeout(() => {
    const el = navTabRefs.value[index]
    const scrollEl = navScrollRef.value
    if (el && scrollEl) {
      const offsetLeft = el.offsetLeft
      scrollEl.scrollTo({
        left: Math.max(0, offsetLeft - scrollEl.clientWidth / 2 + el.clientWidth / 2),
        behavior: 'smooth'
      })
    }
  }, 50)
}

async function onTagChange(value, index) {
  const arr = [...activeTags.value]
  const idx = arr.indexOf(value)
  if (idx > -1) arr.splice(idx, 1)
  else arr.push(value)
  activeTags.value = arr
  roleList.value = []
  loadMoreStatus.value = 0
  pageNo.value = 1
  if (activeNav.value === 'group') {
    await loadGroupList(true)
  } else {
    await loadRoleList(true)
  }
  if (arr.length > 0 && arr.includes(value)) {
    scrollToTag(index)
  }
}

function scrollToTag(index) {
  setTimeout(() => {
    const el = tagItemRefs.value[index]
    const scrollEl = tagScrollRef.value
    if (el && scrollEl) {
      const offsetLeft = el.offsetLeft
      scrollEl.scrollTo({
        left: Math.max(0, offsetLeft - scrollEl.clientWidth / 2 + el.clientWidth / 2),
        behavior: 'smooth'
      })
    }
  }, 50)
}

function onOrderChange(val) {
  sortField.value = val.detail !== undefined ? val.detail : sortField.value
  if (activeNav.value === 'group') {
    loadGroupList(true)
  } else {
    loadRoleList(true)
  }
}

function onScroll(e) {
  const el = e.target
  if (!el) return
  isScrollTop.value = el.scrollTop <= 10
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    onLoadMore()
  }
}

function onSearch() {
  router.push('/pages/discover/search/index')
}

function onRank() {
  router.push('/pages/discover/rank/index')
}

function onLoadMore() {
  if (loadMoreStatus.value !== 0) return
  if (activeNav.value === 'group') {
    loadGroupList(false)
  } else {
    loadRoleList(false)
  }
}

async function loadRoleList(isRefresh = true) {
  if (isRefresh) {
    pageNo.value = 1
    loading.value = true
  } else {
    if (loadMoreStatus.value === 2 || roleList.value.length >= totalCount.value) return
    loadingMore.value = true
    pageNo.value++
  }
  loadMoreStatus.value = 1

  try {
    const params = {
      current: pageNo.value,
      size: pageSize,
      ifSystem: true,
      sortOrder: sortOrder.value,
      sortField: sortField.value,
      characterTypeIds: activeNav.value,
      characterTagIds: activeTags.value.join(',')
    }
    const res = await getCharacterList(params)
    const records = (res && res.records) || []
    if (isRefresh) {
      roleList.value = [...records]
    } else {
      roleList.value = [...roleList.value, ...records]
    }
    totalCount.value = res.total || 0
    loadMoreStatus.value = roleList.value.length >= totalCount.value ? 2 : 0
    listIsEmpty.value = roleList.value.length === 0
    hasLoaded.value = true
  } catch (e) {
    console.error('加载角色列表失败:', e)
    loadMoreStatus.value = 3
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadGroupList(isRefresh = true) {
  if (isRefresh) {
    pageNo.value = 1
    loading.value = true
  } else {
    if (loadMoreStatus.value === 2 || groupList.value.length >= totalCount.value) return
    loadingMore.value = true
    pageNo.value++
  }
  loadMoreStatus.value = 1

  try {
    const params = {
      current: pageNo.value,
      size: pageSize,
      ifSystem: true,
      sortOrder: sortOrder.value,
      sortField: sortField.value,
      characterTypeIds: activeNav.value,
      characterTagIds: activeTags.value.join(',')
    }
    const res = await getUserGroupChatList(params)
    const records = (res && res.records) || []
    if (isRefresh) {
      groupList.value = [...records]
    } else {
      groupList.value = [...groupList.value, ...records]
    }
    totalCount.value = res.total || 0
    loadMoreStatus.value = groupList.value.length >= totalCount.value ? 2 : 0
    listIsEmpty.value = groupList.value.length === 0
    hasLoaded.value = true
  } catch (e) {
    console.error('加载群聊列表失败:', e)
    loadMoreStatus.value = 3
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function onActiveChange(idx) {
  activeForm.current = idx
}

async function onActivityClick() {
  const item = activeForm.list[activeForm.current || 0]
  if (!item) return
  const { type } = item
  if (type === 'discount') {
    discountForm.visible = true
  } else if (type === 'vip') {
    router.push('/pages/vip/packages/index')
  } else if (type === 'point') {
    showToast('请使用积分充值入口')
  } else if (type === 'invite') {
    try {
      const richtext = await getActivity({ activityType: 1 })
      showToast(richtext?.content || '活动详情', { duration: 3000 })
    } catch (e) {
      console.error(e)
    }
  }
}

function discountOverlayClick() {
  discountForm.visible = false
}

async function handleDiscountClick() {
  try {
    const [id, list] = await Promise.all([getGlobalModelId(), getModelList()])
    showToast(`已切换到模型 ID: ${id}（共 ${list.length} 个）`, { duration: 2000 })
  } catch (e) {
    console.error(e)
  }
  discountForm.visible = false
}

async function onRoleClick(role) {
  if (!role || !role.id) return
  try {
    const res = await getCurrentPlotByCharacterId(role.id)
    router.push({
      path: '/pages/chat/index',
      query: {
        plotId: res && res.plotId ? res.plotId : '',
        characterId: role.id,
        isDiscover: 'true'
      }
    })
  } catch (e) {
    console.error('进入角色失败', e)
    showToast('进入失败，请重试')
  }
}

async function onGroupClick(group) {
  if (!group || !group.groupChatId) return
  try {
    const res = await getCurrentPlotByGroupChatId(group.groupChatId)
    let plotId = res && res.plotId ? res.plotId : ''
    if (!plotId) {
      plotId = await createPlot({ groupChatId: group.groupChatId })
    }
    router.push({
      path: '/pages/chat/index',
      query: {
        groupId: group.groupChatId,
        plotId: plotId || ''
      }
    })
  } catch (e) {
    console.error('进入群聊失败', e)
    showToast('进入失败，请重试')
  }
}
</script>

<style lang="scss" scoped>
.discover-page {
  height: 100vh;
  background: #0a0d18;
  color: #fff;
  padding-bottom: var(--tabbar-height-safearea);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.discover-page::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(45% 40% at 15% 20%, rgba(110, 150, 230, 0.55) 0%, rgba(110, 150, 230, 0) 70%),
    radial-gradient(40% 38% at 85% 30%, rgba(160, 120, 220, 0.45) 0%, rgba(160, 120, 220, 0) 70%),
    radial-gradient(38% 35% at 50% 80%, rgba(190, 210, 240, 0.40) 0%, rgba(190, 210, 240, 0) 70%),
    radial-gradient(35% 32% at 75% 75%, rgba(130, 170, 230, 0.50) 0%, rgba(130, 170, 230, 0) 70%);
  filter: blur(40px);
}

.discover-nav-img {
  // width: 77px;
  height: 35px;
  // object-fit: contain;
}

.rank-enter {
  width: 30px;
  height: 30px;
  object-fit: contain;
  cursor: pointer;
}

.top-nav {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  height: 70px;
  padding: 0 32px 16px;
}

.nav-scroll {
  flex: 1;
  height: 70px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-tabs {
  display: inline-flex;
  align-items: center;
  height: 70px;
  white-space: nowrap;
  gap: 12px;
}

.nav-tab {
  position: relative;
  padding: 0 24px;
  height: 70px;
  display: inline-flex;
  align-items: center;
  font-size: 28px;
  font-weight: bold;
  color: #ffffff;
  white-space: nowrap;
  cursor: pointer;
}

.nav-tab.active {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
}

.nav-red-dot {
  position: absolute;
  top: 12px;
  right: 16px;
  width: 16px;
  height: 16px;
  background: #ff4949;
  border-radius: 50%;
}

.nav-underline {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 6px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.search-icon {
  margin-left: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  cursor: pointer;
}

.filter-tags {
  position: relative;
  z-index: 2;
  padding: 0 32px;
  height: 80px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.tags-scroll {
  display: flex;
  align-items: center;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  height: 64px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tag-item {
  display: inline-block;
  padding: 12px 24px;
  margin-right: 16px;
  font-size: 26px;
  color: #999;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 32px;
  white-space: nowrap;
  cursor: pointer;
}

.tag-item.active {
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 500;
}

.content-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 16px 24px;
  overflow-y: auto;
}

.role-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.role-card {
  position: relative;
  aspect-ratio: 0.618;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.role-card:active {
  transform: scale(0.96);
}

.role-card_active {
  grid-column: span 2;
  aspect-ratio: 16 / 9;
}

.role-swiper-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.role-info {
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
}

.role-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 6px;
}

.role-name {
  flex: 1;
  font-size: 30px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-hot-line {
  display: flex;
  gap: 16px;
  font-size: 22px;
  color: rgba(255, 255, 255, 0.7);
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

/* 群聊列表 */
.group-list {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: transform 0.2s;
}

.group-card:active {
  transform: scale(0.98);
}

.group-members {
  margin-bottom: 20px;
  display: flex;
}

.member-avatar {
  width: 60px;
  height: 60px;
  margin-right: -16px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #0a0d18;
}

.member-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-info {
  margin-bottom: 16px;
}

.group-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.group-name {
  flex: 1;
  font-size: 30px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-desc {
  font-size: 24px;
  color: #999;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-footer {
  display: flex;
  gap: 16px;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
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

.empty-state {
  padding: 60px 0;
}

/* 折扣弹窗 */
.discount-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.discount-img {
  width: 90%;
  max-width: 600px;
  border-radius: 20px;
  cursor: pointer;
}
</style>
