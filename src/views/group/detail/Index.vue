<template>
  <div class="group-detail-page" :style="pageStyle">
    <!-- 固定背景图 -->
    <div 
      v-if="showBG && currentBg" 
      class="page-bg" 
      :style="{ backgroundImage: `url(${currentBg})` }"
    ></div>
    
    <!-- 可滚动内容区域 -->
    <div class="scroll-content">
      <!-- 毛玻璃信息卡片 -->
      <div class="info-card">
        <div class="group-name-section">
          <span class="group-name">{{ groupInfo.name || '群聊名称' }}</span>
          <div v-if="plotInfo.id" class="chat-setting" @click="onDialogSetting">
            对话设定
            <van-icon name="arrow" class="chat-setting-icon" />
          </div>
        </div>
        <div class="group-tags">
          <span v-for="(tag, idx) in groupInfo.tags" :key="idx" class="tag">#{{ tag.name }}</span>
        </div>
        <div v-if="groupInfo.publishStatus > 0 || groupInfo.isSystem == 1" class="role-hot-container">
          <RoleHotBadge :chat-count="groupInfo.messageCount" :role-hot="groupInfo.browseCount" />
        </div>
      </div>

      <div class="detail-content">
        <!-- 标签页 -->
        <div class="tabs">
          <span 
            class="tab" 
            :class="{ active: currentTab === '1' }" 
            @click="onTabChange('1')"
          >关于TA</span>
          <span 
            class="tab" 
            :class="{ active: currentTab === '2' }" 
            @click="onTabChange('2')"
          >故事</span>
          <span 
            class="tab" 
            :class="{ active: currentTab === '3' }" 
            @click="onTabChange('3')"
          >记忆</span>
        </div>

        <!-- 关于TA -->
        <div v-if="currentTab === '1'" class="content-section">
          <div class="section-title-container">
            <div class="section-title">群简介</div>
          </div>
          <div class="section-content">
            <text>{{ descriptionDisplay || groupInfo.description || '暂无描述' }}</text>
            <span v-if="descriptionNeedFold" class="fold-toggle" @click="toggleDescription">
              {{ descriptionExpanded ? '收起 ▴' : '展开 ▾' }}
            </span>
          </div>

          <div class="section-title-container">
            <div class="section-title">群成员</div>
          </div>
          <div class="section-content">
            <div 
              v-for="item in groupInfo.characterInfos" 
              :key="item.id"
              class="group-role-item"
              @click="onCharacterInfo(item)"
            >
              <img :src="item.avatar" class="role-avatar" />
              <div class="role-content-box">
                <div class="role-name">{{ item.name }}</div>
                <div class="role-tags">
                  <span v-for="(tag, idx) in item.tagNames" :key="idx" class="role-tag">#{{ tag }}</span>
                </div>
              </div>
              <span class="section-desc yellow-btn-text">查看设定</span>
              <van-icon name="arrow" class="section-desc-icon" />
            </div>
          </div>

          <div class="section-title-container">
            <div class="section-title">创作者</div>
          </div>
          <div class="section-content">
            <div v-if="creatorInfo.creatorUserId" class="group-role-item creator-item">
              <img v-if="creatorInfo.creatorAvatar" :src="creatorInfo.creatorAvatar" class="creator-avatar" />
              <div v-else class="creator-avatar avatar-default">{{ creatorInfo.creatorNickname?.charAt(0) || '?' }}</div>
              <div class="role-content-box">
                <div class="role-name">{{ creatorInfo.creatorNickname }}</div>
              </div>
              <div v-if="!isOwnCreator" class="follow-btn-container">
                <div v-if="isFollowed" class="follow-btn followed" @click="onUnfollow">
                  <van-icon name="success" size="20" />
                  <span>已关注</span>
                </div>
                <div v-else class="follow-btn unfollowed" @click="onFollow">
                  <van-icon name="plus" size="20" />
                  <span>关注</span>
                </div>
              </div>
            </div>
            <div v-else class="no-creator-tip">暂无创作者信息</div>
          </div>
        </div>

        <!-- 故事 -->
        <div v-else-if="currentTab === '2'" class="content-section">
          <div class="section-title-container" @click="onChangeStory">
            <div class="section-title">当前故事</div>
            <van-icon name="arrow" class="section-title-icon ml-auto" />
          </div>
          <div class="section-content">
            <text>{{ storyInfo.title || '暂无' }}</text>
          </div>

          <div class="section-title-container">
            <div class="section-title">故事剧情</div>
          </div>
          <div class="section-content">
            <text>{{ storyInfo.scene || '暂无' }}</text>
          </div>

          <div class="section-title-container">
            <div class="section-title">开场白</div>
          </div>
          <div class="section-content">
            <div v-if="storyInfo.prologueCharacterId" class="group-role-item">
              <img :src="plotInfo.prologueCharacterBackgroundImage" class="role-avatar" />
              <div class="role-content-box">
                <div class="role-name">{{ plotInfo.prologueCharacterName }}</div>
              </div>
            </div>
            {{ storyInfo.prologue || '用户自由开场' }}
          </div>

          <div class="new-story-line" @click="newStoryAction">
            这个故事没意思？打开脑洞，<span class="new-story-btn">来个新开局！</span>
          </div>
        </div>

        <!-- 记忆 -->
        <div v-else-if="currentTab === '3'" class="content-section">
          <div class="section-title-container" @click="onPlotSelect">
            <div class="section-title">当前剧情</div>
            <van-icon name="arrow" class="section-title-icon" />
          </div>
          <div class="plot-content">
            <text>{{ plotInfo.id ? plotInfo.title : '暂无' }}</text>
          </div>

          <div class="section-title-container" @click="onMySetting">
            <div class="section-title">我的设定</div>
            <van-icon v-if="plotInfo.id" name="arrow" class="section-title-icon" />
          </div>
          <div class="setting-block">
            <div class="setting-row">
              <div class="setting-item-inline">
                <text class="setting-item-title">我的名称</text>
                <text class="setting-item-value">{{ plotInfo.persona?.userAddressedAs || '暂无' }}</text>
              </div>
              <div class="setting-item-inline">
                <text class="setting-item-title">性别</text>
                <text class="setting-item-value">{{ plotInfo.persona?.gender || '暂无' }}</text>
              </div>
            </div>
            <div class="setting-identity">
              <text class="setting-item-title">我是谁</text>
              <div class="identity-content">
                <text>{{ identityDisplay || plotInfo.persona?.identity || '暂无' }}</text>
                <span v-if="identityNeedFold" class="fold-toggle-inline" @click="toggleIdentity">
                  {{ identityExpanded ? '收起 ▴' : '展开 ▾' }}
                </span>
              </div>
            </div>
          </div>

          <div class="section-title-container" @click="onMemorySetting">
            <div class="section-title">
              智能体记忆力
              <van-icon name="info-o" size="18" class="memory-info-icon" @click.stop="onMemoryDesc" />
            </div>
            <text class="section-desc yellow-btn-text">记忆加强</text>
            <van-icon name="arrow" class="section-title-icon" />
          </div>
          <MemoryDisplay :current-memory="plotInfo.memoryCount" :memory-options="memoryOptions" />
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="groupInfo.id" class="bottom-bar">
      <div class="action-btn secondary" @click="onShare">
        <van-icon name="share-o" />
        <span>分享</span>
      </div>
      <div class="action-btn primary" @click="onStartChat">
        <van-icon name="chat-o" />
        <span>开始对话</span>
      </div>
    </div>

    <!-- 弹窗 -->
    <TipDialog ref="tipDialogRef" />
    <StoryDialog ref="storyDialogRef" />
    <MemorySheet ref="memorySheetRef" />

    <CustomNav title="" :show-back="true" :transparent="true" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'
import StoryDialog from '@/components/dialogs/StoryDialog.vue'
import RoleHotBadge from '@/components/common/RoleHotBadge.vue'
import MemoryDisplay from '@/components/common/MemoryDisplay.vue'
import MemorySheet from '@/components/common/MemorySheet.vue'
import { getGroupDetail, shareGroup, followUser, unfollowUser } from '@/api/group'
import { getMemoryType, updatePlot, createStory } from '@/api/ai/chat'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// Refs
const tipDialogRef = ref(null)
const storyDialogRef = ref(null)
const memorySheetRef = ref(null)

// 状态
const groupInfo = ref({
  id: null,
  name: '',
  description: '',
  tags: [],
  characterInfos: []
})

const storyInfo = ref({
  id: null,
  title: '暂无',
  scene: '',
  prologue: ''
})

const plotInfo = ref({
  id: null,
  title: '暂无',
  memoryCount: 0,
  prologueCharacterBackgroundImage: '',
  prologueCharacterName: '',
  persona: {}
})

const currentTab = ref('1')
const descriptionExpanded = ref(false)
const descriptionNeedFold = ref(false)
const descriptionDisplay = ref('')
const prologueExpanded = ref(false)
const prologueNeedFold = ref(false)
const prologueDisplay = ref('')
const identityExpanded = ref(false)
const identityNeedFold = ref(false)
const identityDisplay = ref('')
const currentBg = ref('')
const showBG = ref(true)
const creatorInfo = ref({
  creatorUserId: null,
  creatorNickname: '',
  creatorAvatar: ''
})
const isFollowed = ref(false)
const isOwnCreator = ref(false)
const memoryOptions = ref([])

const pageStyle = computed(() => ({
  minHeight: '100vh',
  position: 'relative'
}))

// 生命周期
onMounted(async () => {
  const ev = localStorage.getItem('aE')
  if (ev === '0') {
    showBG.value = false
  }

  const { groupId, plotId } = route.query
  if (plotId) {
    plotInfo.value.id = plotId
  }
  if (groupId) {
    groupInfo.value.id = groupId
    await loadMemoryOptions()
    loadGroupDetail()
  }
})

async function loadMemoryOptions() {
  try {
    const res = await getMemoryType()
    memoryOptions.value = res || []
  } catch (e) {
    console.error('获取记忆类型失败', e)
  }
}

async function loadGroupDetail() {
  try {
    const res = await getGroupDetail(groupInfo.value.id, plotInfo.value.id)
    
    groupInfo.value = { ...groupInfo.value, ...res }
    
    const desc = res.description || ''
    descriptionNeedFold.value = desc.length > 120
    descriptionDisplay.value = descriptionNeedFold.value && !descriptionExpanded.value
      ? desc.slice(0, 120) + '…'
      : desc

    const currentUserId = userStore.userInfo?.id
    const creatorId = res.creatorUserId || null
    creatorInfo.value = {
      creatorUserId: creatorId,
      creatorNickname: res.creatorNickname || '',
      creatorAvatar: res.creatorAvatar || ''
    }
    isFollowed.value = res.isFollowedCreator || false
    isOwnCreator.value = !!(currentUserId && creatorId && currentUserId === creatorId)

    const plotId = res.currentPlotId
    if (!plotId) {
      currentBg.value = res.backgroundImage
      plotInfo.value = {
        ...plotInfo.value,
        id: null,
        memoryCount: 0,
        persona: res.defaultPersona || {}
      }
      storyInfo.value = { ...storyInfo.value, ...res.defaultStoryDetail }

      const prologue = res.defaultStoryDetail?.prologue || ''
      prologueNeedFold.value = prologue.length > 120
      prologueDisplay.value = prologueNeedFold.value && !prologueExpanded.value
        ? prologue.slice(0, 120) + '…'
        : prologue
    } else {
      const identity = res.plotDetailVO?.persona?.identity || ''
      identityNeedFold.value = identity.length > 30
      identityDisplay.value = identityNeedFold.value && !identityExpanded.value
        ? identity.slice(0, 30) + '…'
        : identity

      plotInfo.value = {
        ...plotInfo.value,
        ...res.plotDetailVO,
        id: plotId
      }
      storyInfo.value = { ...storyInfo.value, ...res.plotDetailVO?.story }
      currentBg.value = res.plotDetailVO?.backgroundImage

      const prologue = res.plotDetailVO?.story?.prologue || ''
      prologueNeedFold.value = prologue.length > 120
      prologueDisplay.value = prologueNeedFold.value && !prologueExpanded.value
        ? prologue.slice(0, 120) + '…'
        : prologue
    }
  } catch (e) {
    console.error('获取群聊详情失败', e)
  }
}

function onTabChange(tab) {
  currentTab.value = tab
}

function toggleDescription() {
  descriptionExpanded.value = !descriptionExpanded.value
  const desc = groupInfo.value.description || ''
  descriptionDisplay.value = descriptionNeedFold.value && !descriptionExpanded.value
    ? desc.slice(0, 120) + '…'
    : desc
}

function togglePrologue() {
  prologueExpanded.value = !prologueExpanded.value
  const prologue = storyInfo.value.prologue || ''
  prologueDisplay.value = prologueNeedFold.value && !prologueExpanded.value
    ? prologue.slice(0, 120) + '…'
    : prologue
}

function toggleIdentity() {
  identityExpanded.value = !identityExpanded.value
  const identity = plotInfo.value.persona?.identity || ''
  identityDisplay.value = identityNeedFold.value && !identityExpanded.value
    ? identity.slice(0, 30) + '…'
    : identity
}

function onStartChat() {
  if (!groupInfo.value.id) return
  router.push({
    path: '/pages/chat/index',
    query: {
      groupId: groupInfo.value.id,
      plotId: plotInfo.value.id || ''
    }
  })
}

function onShare() {
  shareGroup({ groupId: groupInfo.value.id })
  showToast({ message: '分享链接已复制', icon: 'none' })
}

function onDialogSetting() {
  router.push({
    path: '/pages/role/chat-setting/index',
    query: {
      plotId: plotInfo.value.id,
      groupChatName: groupInfo.value.name,
      groupId: groupInfo.value.id
    }
  })
}

function onMySetting() {
  if (!plotInfo.value.id) return
  router.push({
    path: '/pages/role/my-setting/index',
    query: {
      personaId: plotInfo.value.persona?.id || '',
      storyId: storyInfo.value.id,
      avatarUrl: currentBg.value,
      plotId: plotInfo.value.id
    }
  })
}

function onPlotSelect() {
  router.push({
    path: '/pages/group/plot/index',
    query: { groupId: groupInfo.value.id }
  })
}

function onChangeStory() {
  router.push({
    path: '/pages/group/story/index',
    query: { groupId: groupInfo.value.id }
  })
}

function onMemorySetting() {
  if (!plotInfo.value.id) {
    showToast({ message: '请先选择剧情', icon: 'none' })
    return
  }
  memorySheetRef.value?.show({
    currentCount: plotInfo.value.memoryCount,
    plotId: plotInfo.value.id,
    memoryOptions: memoryOptions.value,
    onConfirm: async (count) => {
      try {
        await updatePlot({
          id: plotInfo.value.id,
          memoryCount: count
        })
        plotInfo.value.memoryCount = count
        showToast({ message: '保存成功', icon: 'success' })
      } catch (e) {
        showToast({ message: '保存失败', icon: 'none' })
      }
    }
  })
}

function onMemoryDesc() {}

function newStoryAction() {
  storyDialogRef.value?.show({
    roles: groupInfo.value.characterInfos,
    onConfirm: async (data) => {
      try {
        await createStory({
          ...data,
          groupChatId: groupInfo.value.id
        })
        showToast({ message: '创建成功', icon: 'success' })
        loadGroupDetail()
      } catch (e) {
        showToast({ message: '创建失败', icon: 'none' })
      }
    }
  })
}

function onCharacterInfo(item) {
  router.push({
    path: '/pages/role/role-detail/index',
    query: { characterId: item.id }
  })
}

async function onFollow() {
  if (!creatorInfo.value.creatorUserId) return
  if (isOwnCreator.value) {
    showToast({ message: '不能关注自己', icon: 'none' })
    return
  }
  try {
    await followUser(creatorInfo.value.creatorUserId)
    isFollowed.value = true
    showToast({ message: '关注成功', icon: 'success' })
  } catch (e) {
    showToast({ message: '关注失败', icon: 'none' })
  }
}

async function onUnfollow() {
  if (!creatorInfo.value.creatorUserId) return
  try {
    await unfollowUser(creatorInfo.value.creatorUserId)
    isFollowed.value = false
    showToast({ message: '已取消关注', icon: 'success' })
  } catch (e) {
    showToast({ message: '取关失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.group-detail-page {
  min-height: 100vh;
  background: #252525;
  position: relative;
  padding-bottom: 160px;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  z-index: 0;
}

.scroll-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding-top: 88px;
}

.info-card {
  margin: 24rpx;
  padding: 32rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.group-name-section {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.group-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}

.chat-setting {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  padding: 8rpx 16rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
}

.group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  padding: 4rpx 16rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
}

.detail-content {
  margin: 0 24rpx 24rpx;
  padding: 32rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.tabs {
  display: flex;
  gap: 32rpx;
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding-bottom: 8rpx;
  
  &.active {
    color: #fff;
    font-weight: bold;
    border-bottom: 2px solid #FF5F15;
  }
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.section-title-container {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #fff;
}

.section-title-icon {
  color: rgba(255, 255, 255, 0.6);
  margin-left: auto;
}

.ml-auto {
  margin-left: auto;
}

.section-content,
.plot-content,
.setting-block {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.group-role-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 16rpx 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.role-avatar,
.creator-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  object-fit: cover;

  &.avatar-default {
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 28rpx;
    font-weight: bold;
  }
}

.role-content-box {
  flex: 1;
  min-width: 0;
}

.role-name {
  font-size: 28rpx;
  color: #fff;
  margin-bottom: 8rpx;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.role-tag {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.section-desc {
  font-size: 24rpx;
  flex-shrink: 0;
}

.yellow-btn-text {
  color: #FFD700;
}

.section-desc-icon {
  margin-left: 4rpx;
  color: rgba(255, 255, 255, 0.6);
}

.creator-item {
  padding: 16rpx;
}

.follow-btn-container {
  margin-left: auto;
}

.follow-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  cursor: pointer;

  &.followed {
    background: rgba(255, 95, 21, 0.2);
    color: #FF5F15;
  }

  &.unfollowed {
    background: #FF5F15;
    color: #fff;
  }
}

.no-creator-tip {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
}

.fold-toggle {
  display: inline-block;
  color: #FF5F15;
  margin-left: 16rpx;
  font-size: 26rpx;
}

.new-story-line {
  text-align: center;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  padding: 24rpx;
}

.new-story-btn {
  color: #FF5F15;
}

.setting-block {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.setting-row {
  display: flex;
  gap: 32rpx;
}

.setting-item-inline {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.setting-item-title {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.setting-item-value {
  font-size: 28rpx;
  color: #fff;
}

.setting-identity {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.identity-content {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}

.fold-toggle-inline {
  color: #FF5F15;
  font-size: 24rpx;
  flex-shrink: 0;
}

.memory-info-icon {
  color: rgba(255, 255, 255, 0.8);
  margin-left: 8rpx;
}

.section-desc {
  margin-left: auto;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(37, 37, 37, 0.95);
  backdrop-filter: blur(20px);
  z-index: 50;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  cursor: pointer;

  &.secondary {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  &.primary {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    color: #fff;
  }
}
</style>
