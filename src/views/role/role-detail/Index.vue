<template>
  <div class="role-detail-page" :style="pageStyle">
    <!-- 固定背景图 -->
    <div 
      v-if="showBG && currentBg" 
      class="page-bg" 
      :style="{ backgroundImage: `url(${currentBg})` }"
    ></div>
    
    <!-- 可滚动内容区域 -->
    <div class="scroll-content" @scroll="onScroll">
      <!-- 毛玻璃信息卡片 -->
      <div class="info-card blur-glass">
        <div class="role-name-section">
          <span class="role-name">{{ roleInfo.name || '角色名称' }}</span>
          <van-icon v-if="roleInfo.gender === '男'" name="friends-o" class="role-gender male" />
          <van-icon v-else-if="roleInfo.gender === '女'" name="friends-o" class="role-gender female" />
          <div v-if="plotInfo.id" class="chat-setting" @click="onDialogSetting">
            对话设定
            <van-icon name="arrow" class="chat-setting-icon" />
          </div>
        </div>
        <div class="role-tags">
          <span v-for="(tag, idx) in roleInfo.tags" :key="idx" class="tag">#{{ tag.name }}</span>
        </div>
        <div v-if="roleInfo.publishStatus > 0 || roleInfo.isSystem == 1" class="role-hot-container">
          <RoleHotBadge :chat-count="roleInfo.messageCount" :role-hot="roleInfo.browseCount" />
        </div>
      </div>

      <div class="detail-content blur-glass">
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
          <span 
            class="tab" 
            :class="{ active: currentTab === '4' }" 
            @click="onTabChange('4')"
          >群聊</span>
        </div>

        <!-- 关于TA -->
        <div v-if="currentTab === '1'" class="content-section">
          <div class="section-title-container" @click="onChatVoice">
            <div class="section-title">角色声音</div>
            <van-icon v-if="plotInfo.id" name="arrow" class="section-title-icon" />
          </div>
          <div class="style-content like-blur-glass">
            <text>{{ roleInfo.userVoiceName || roleInfo.voiceName || '' }}</text>
            <div class="style-right-content">
              <text class="style-right-text">{{ roleInfo.userVoiceName ? '' : '默认设置' }}</text>
            </div>
          </div>

          <div class="section-title-container">
            <div class="section-title">TA的设定</div>
          </div>
          <div class="section-content like-blur-glass">
            <text>{{ descriptionDisplay || roleInfo.description || '暂无描述' }}</text>
            <span v-if="descriptionNeedFold" class="fold-toggle" @click="toggleDescription">
              {{ descriptionExpanded ? '收起 ▴' : '展开 ▾' }}
            </span>
          </div>

          <div class="section-title-container">
            <div class="section-title">创作者</div>
          </div>
          <div class="section-content like-blur-glass">
            <div v-if="creatorInfo.creatorUserId" class="group-role-item creator-item">
              <img v-if="creatorInfo.creatorAvatar" :src="creatorInfo.creatorAvatar" class="creator-avatar" />
              <div v-else class="creator-avatar avatar-default">{{ creatorInfo.creatorNickname?.charAt(0) || '?' }}</div>
              <div class="role-content-box">
                <div class="role-name">{{ creatorInfo.creatorNickname }}</div>
              </div>
              <div v-if="!isOwnCreator" class="follow-btn-container">
                <div v-if="isFollowed" class="follow-btn followed" @click="onUnfollow">
                  <van-icon name="success" size="20" class="follow-icon" />
                  <span>已关注</span>
                </div>
                <div v-else class="follow-btn unfollowed" @click="onFollow">
                  <van-icon name="plus" size="20" class="follow-icon" />
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
          <div class="section-content like-blur-glass">
            <text>{{ storyInfo.title || '暂无' }}</text>
          </div>

          <div class="section-title-container">
            <div class="section-title">故事剧情</div>
          </div>
          <div class="section-content like-blur-glass">
            <text>{{ storyInfo.scene || '暂无' }}</text>
          </div>

          <div class="section-title-container">
            <div class="section-title">开场白</div>
          </div>
          <div class="section-content like-blur-glass">
            <text>{{ prologueDisplay || storyInfo.prologue || '暂无' }}</text>
            <span v-if="prologueNeedFold" class="fold-toggle" @click="togglePrologue">
              {{ prologueExpanded ? '收起 ▴' : '展开 ▾' }}
            </span>
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
          <div class="plot-content like-blur-glass">
            <text>{{ plotInfo.id ? plotInfo.title : '暂无' }}</text>
          </div>

          <div class="section-title-container" @click="onMySetting">
            <div class="section-title">我的设定</div>
            <van-icon v-if="plotInfo.id" name="arrow" class="section-title-icon" />
          </div>
          <div class="setting-block like-blur-glass">
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

        <!-- 群聊 -->
        <div v-else-if="currentTab === '4'" class="content-section">
          <div class="group-list">
            <div 
              v-for="group in publicGroupChats" 
              :key="group.groupChatId"
              class="group-card"
              @click="onGroupClick(group.groupChatId)"
            >
              <div 
                v-if="group.backgroundImages && group.backgroundImages.length" 
                class="group-card-bg"
                :style="{ backgroundImage: `url(${group.backgroundImages[0]})` }"
              >
                <div class="group-card-bg-mask"></div>
              </div>

              <div class="group-members">
                <div 
                  v-for="(bg, idx) in group.backgroundImages?.slice(0, 4)" 
                  :key="idx"
                  class="member-avatar"
                  :style="{ zIndex: idx }"
                >
                  <img :src="bg" class="member-avatar-img" />
                </div>
              </div>

              <div class="group-info">
                <div class="group-name-row">
                  <text class="group-name">{{ group.name }}</text>
                </div>
                <text class="group-desc">{{ group.description || '暂无简介' }}</text>
              </div>

              <div v-if="group.heat" class="group-footer">
                <RoleHotBadge :role-hot="group.heat" :chat-count="group.chatCount || 0" />
              </div>
            </div>

            <div v-if="!publicGroupChats || !publicGroupChats.length" class="group-empty">
              暂无关联群聊
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="roleInfo.id" class="bottom-bar">
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
import { getCharacterDetail, shareCharacter } from '@/api/role'
import { getCurrentPlotByGroupChatId } from '@/api/group'
import { createPlot } from '@/api/ai/chat'
import { followUser, unfollowUser } from '@/api/group'
import { getMemoryType, updatePlot, createStory, getPlotDetail } from '@/api/ai/chat'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// Refs
const tipDialogRef = ref(null)
const storyDialogRef = ref(null)
const memorySheetRef = ref(null)

// 状态
const roleInfo = ref({
  id: null,
  name: '',
  isSystem: false,
  gender: '',
  avatarUrl: '',
  description: '',
  tags: []
})

const storyInfo = ref({
  id: null,
  prologue: ''
})

const plotInfo = ref({
  id: null,
  title: '暂无',
  totalMemory: 30,
  memoryCount: 0,
  memoryOptionId: null,
  chatStyle: { id: null, title: '' },
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
const publicGroupChats = ref([])
const memoryOptions = ref([])

const pageStyle = computed(() => ({
  minHeight: '100vh',
  position: 'relative'
}))

// 生命周期
onMounted(async () => {
  // 检查背景显示设置
  const ev = localStorage.getItem('aE')
  if (ev === '0') {
    showBG.value = false
  }

  // 获取角色ID
  const characterId = route.query.characterId
  if (characterId) {
    roleInfo.value.id = characterId
    await loadMemoryOptions()
    loadRoleDetail(characterId)
  }
})

// 加载记忆选项
async function loadMemoryOptions() {
  try {
    const res = await getMemoryType()
    memoryOptions.value = res || []
  } catch (e) {
    console.error('获取记忆类型失败', e)
  }
}

// 加载角色详情
async function loadRoleDetail(id) {
  try {
    const res = await getCharacterDetail(id)
    
    // 合并角色信息
    roleInfo.value = {
      ...roleInfo.value,
      ...res
    }

    // 处理描述折叠
    const desc = res.description || ''
    descriptionNeedFold.value = desc.length > 120
    descriptionDisplay.value = descriptionNeedFold.value && !descriptionExpanded.value
      ? desc.slice(0, 120) + '…'
      : desc

    // 创作者信息
    const currentUserId = userStore.userInfo?.id
    const creatorId = res.creatorUserId || null
    creatorInfo.value = {
      creatorUserId: creatorId,
      creatorNickname: res.creatorNickname || '',
      creatorAvatar: res.creatorAvatar || ''
    }
    isFollowed.value = res.isFollowedCreator || false
    isOwnCreator.value = !!(currentUserId && creatorId && currentUserId === creatorId)
    
    // 关联群聊
    publicGroupChats.value = res.publicGroupChats || []

    // 剧情信息
    const plotId = res.currentPlotId
    if (!plotId) {
      currentBg.value = res.backgroundImage
      plotInfo.value = {
        ...plotInfo.value,
        chatStyle: res.defaultChatStyleDetail,
        memoryCount: 0,
        memoryOptionId: null,
        id: null,
        persona: res.defaultPersona || {}
      }
      storyInfo.value = {
        ...storyInfo.value,
        ...res.defaultStoryDetail
      }

      // 开场白折叠
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
      storyInfo.value = {
        ...storyInfo.value,
        ...res.plotDetailVO?.story
      }
      currentBg.value = res.plotDetailVO?.backgroundImage

      // 开场白折叠
      const prologue = res.plotDetailVO?.story?.prologue || ''
      prologueNeedFold.value = prologue.length > 120
      prologueDisplay.value = prologueNeedFold.value && !prologueExpanded.value
        ? prologue.slice(0, 120) + '…'
        : prologue
    }
  } catch (e) {
    console.error('获取角色详情失败', e)
  }
}

// Tab 切换
function onTabChange(tab) {
  currentTab.value = tab
}

// 描述折叠/展开
function toggleDescription() {
  descriptionExpanded.value = !descriptionExpanded.value
  const desc = roleInfo.value.description || ''
  descriptionDisplay.value = descriptionNeedFold.value && !descriptionExpanded.value
    ? desc.slice(0, 120) + '…'
    : desc
}

// 开场白折叠/展开
function togglePrologue() {
  prologueExpanded.value = !prologueExpanded.value
  const prologue = storyInfo.value.prologue || ''
  prologueDisplay.value = prologueNeedFold.value && !prologueExpanded.value
    ? prologue.slice(0, 120) + '…'
    : prologue
}

// 身份折叠/展开
function toggleIdentity() {
  identityExpanded.value = !identityExpanded.value
  const identity = plotInfo.value.persona?.identity || ''
  identityDisplay.value = identityNeedFold.value && !identityExpanded.value
    ? identity.slice(0, 30) + '…'
    : identity
}

// 滚动事件
function onScroll(e) {
  // H5 环境滚动处理
}

// 开始聊天
function onStartChat() {
  if (!roleInfo.value.id) return
  router.push({
    path: '/pages/chat/index',
    query: {
      characterId: roleInfo.value.id,
      plotId: plotInfo.value.id || ''
    }
  })
}

// 分享
function onShare() {
  shareCharacter({ characterId: roleInfo.value.id })
  showToast({ message: '分享链接已复制', icon: 'none' })
}

// 对话设定
function onDialogSetting() {
  if (!plotInfo.value.id) {
    showToast({ message: '请先选择剧情', icon: 'none' })
    return
  }
  router.push({
    path: '/pages/role/chat-setting/index',
    query: {
      plotId: plotInfo.value.id,
      roleName: roleInfo.value.name
    }
  })
}

// 角色声音
function onChatVoice() {
  router.push({
    path: '/pages/role/voice-list/index',
    query: {
      characterId: roleInfo.value.id || '',
      voiceId: roleInfo.value.userVoiceId || roleInfo.value.voiceId || ''
    }
  })
}

// 我的设定
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

// 剧情选择
function onPlotSelect() {
  router.push({
    path: '/pages/role/plot/index',
    query: { roleId: roleInfo.value.id }
  })
}

// 故事选择
function onChangeStory() {
  router.push({
    path: '/pages/role/story/index',
    query: { roleId: roleInfo.value.id }
  })
}

// 记忆设置
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

// 记忆说明
function onMemoryDesc() {
  // TODO: 显示记忆说明弹窗
}

// 新故事
function newStoryAction() {
  storyDialogRef.value?.show({
    roles: [{ id: roleInfo.value.id, avatar: currentBg.value }],
    onConfirm: async (data) => {
      try {
        await createStory({
          ...data,
          characterId: roleInfo.value.id
        })
        showToast({ message: '创建成功', icon: 'success' })
        // 刷新数据
        loadRoleDetail(roleInfo.value.id)
      } catch (e) {
        showToast({ message: '创建失败', icon: 'none' })
      }
    }
  })
}

// 关注创作者
async function onFollow() {
  if (!creatorInfo.value.creatorUserId) {
    showToast({ message: '创作者信息不存在', icon: 'none' })
    return
  }
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

// 取关创作者
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

// 点击群聊
async function onGroupClick(groupChatId) {
  if (!groupChatId) return
  try {
    const res = await getCurrentPlotByGroupChatId(groupChatId)
    let plotId = res?.plotId || ''
    if (!plotId) {
      plotId = await createPlot({
        groupChatId: groupChatId
      })
    }
    router.push({
      path: '/pages/chat/index',
      query: {
        groupId: groupChatId,
        plotId: plotId || ''
      }
    })
  } catch (e) {
    console.error('进入群聊失败', e)
  }
}
</script>

<style lang="scss" scoped>
.role-detail-page {
  min-height: 100vh;
  background: #252525;
  position: relative;
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
  padding-bottom: 160px;
}

.info-card {
  margin: 24rpx;
  padding: 32rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.role-name-section {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.role-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}

.role-gender {
  font-size: 28rpx;
  
  &.male { color: #4fc3f7; }
  &.female { color: #f48fb1; }
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

.role-tags {
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

.role-hot-container {
  margin-top: 16rpx;
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
  cursor: pointer;
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
.style-content,
.plot-content,
.setting-block {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.style-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.style-right-content {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: rgba(255, 255, 255, 0.6);
}

.style-right-text {
  font-size: 24rpx;
}

.fold-toggle {
  display: inline-block;
  color: #FF5F15;
  margin-left: 16rpx;
  font-size: 26rpx;
}

.group-role-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.creator-item {
  padding: 16rpx;
}

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
  margin-right: 16rpx;
}

.yellow-btn-text {
  color: #FFD700;
  font-size: 24rpx;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.group-card {
  position: relative;
  border-radius: 20rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.group-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background-size: cover;
  background-position: center;
}

.group-card-bg-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
}

.group-members {
  position: relative;
  display: flex;
  padding: 80rpx 24rpx 24rpx;
}

.member-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 2px solid #fff;
  margin-left: -16rpx;
  overflow: hidden;

  &:first-child {
    margin-left: 0;
  }
}

.member-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-info {
  padding: 0 24rpx 24rpx;
}

.group-name-row {
  margin-bottom: 8rpx;
}

.group-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #fff;
}

.group-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-footer {
  padding: 0 24rpx 24rpx;
}

.group-empty {
  text-align: center;
  padding: 48rpx;
  color: rgba(255, 255, 255, 0.6);
  font-size: 28rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  padding-bottom: calc(24rpx + var(--safearea-bottom));
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
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
  }

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
