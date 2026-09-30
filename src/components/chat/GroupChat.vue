<template>
  <div class="group-chat-wrapper" :style="{ height: contentHeight }">
    <!-- 角色切换条 -->
    <div v-if="roles.length > 0" class="role-bar">
      <div 
        v-for="role in roles" 
        :key="role.id"
        class="role-item"
        :class="{ active: activeRoleId === role.id }"
        @click="onRoleTap(role)"
      >
        <img :src="role.avatarUrl" class="role-avatar" />
        <span class="role-name">{{ role.name }}</span>
      </div>
    </div>

    <!-- 消息列表 -->
    <div 
      class="message-list"
      @scroll="onScroll"
    >
      <van-pull-refresh 
        v-model="refreshing"
        @refresh="onRefresh"
      >
        <div 
          v-for="(msg, idx) in msgList" 
          :key="msg.id || idx"
          :id="`msg-${msg.id}`"
          class="message-item"
        >
          <!-- 群聊消息渲染 -->
          <GroupRoleMsg
            v-if="msg.senderType === 2"
            :message="msg"
            :roles="roles"
            :is-latest="idx === msgList.length - 1"
            :disabled="isGenerating"
            @mask-show="onMaskShow"
          />
          
          <UserMsg
            v-else
            :message="msg"
            :disabled="isGenerating"
            @mask-show="onMaskShow"
          />
        </div>
      </van-pull-refresh>

      <!-- 底部锚点 -->
      <div id="bottom-anchor" class="bottom-anchor"></div>
    </div>

    <!-- 底部蒙版按钮 -->
    <div 
      v-if="maskVisible" 
      class="mask-overlay" 
      @click="hideMask"
    ></div>
    
    <div 
      v-if="maskVisible" 
      class="mask-buttons"
      :style="{
        top: maskButtonTop + 'px',
        right: maskButtonRight + 'px'
      }"
      @click.stop="stopPropagation"
    >
      <div class="mask-btn">复制</div>
    </div>

    <!-- 输入框 -->
    <InputBox
      :plot-info="plotInfo"
      :role-info="{}"
      :group-info="groupInfo"
      :disabled="isGenerating"
      @send-message="onSendMessage"
      @keyboard-height-change="onKeyboardHeightChange"
      @input-line-change="onInputLineChange"
      @hide-tabbar="$emit('hideTabbar')"
      @show-tabbar="$emit('showTabbar')"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { showToast } from 'vant'
import UserMsg from '@/components/chat/UserMsg.vue'
import InputBox from '@/components/chat/InputBox.vue'
import GroupRoleMsg from './GroupRoleMsg.vue'
import { 
  sendMessage as groupSendMessage,
  createPlot as createGroupPlot,
  getPlotMessage 
} from '@/api/ai/chat'
import { getGroupDetailByParams } from '@/api/group'

const props = defineProps({
  groupInfo: {
    type: Object,
    default: () => ({})
  },
  showBack: {
    type: Boolean,
    default: true
  },
  plotInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'hideTabbar',
  'showTabbar'
])

// 状态
const roles = ref([])
const activeRoleId = ref('')
const msgList = ref([])
const keyboardHeight = ref(0)
const contentHeight = ref('100%')
const isGenerating = ref(false)
const userScrolled = ref(false)
const maskVisible = ref(false)
const maskButtonTop = ref(0)
const maskButtonRight = ref(0)
const refreshing = ref(false)
const hasMore = ref(true)
const chatDetail = ref({ plotId: null, updateTime: null })
const pagination = ref({ size: 10, current: 1, plotId: null })

// 滚动相关
let _lastScrollTop = 0
let _lastAutoScrollTime = 0
let _isAutoScrolling = false

// 初始化
onMounted(() => {
  initGroup()
  initKeyboardListener()
})

onUnmounted(() => {
  removeKeyboardListener()
})

function initGroup() {
  if (props.groupInfo.roles) {
    roles.value = [...props.groupInfo.roles]
  }
  // 群聊页目前统一不用剧情背景；如需启用，调用 backgroundStore.setBg(bg) 即可
}

// 角色点击
function onRoleTap(role) {
  // 如果正在生成，忽略
  if (isGenerating.value) return
  
  activeRoleId.value = role.id
  showToast({ message: `切换到 ${role.name}`, icon: 'none' })
  // TODO: 实现角色切换发送消息
}

// 发送消息
async function onSendMessage({ content, imageList = [] }) {
  if (!content && (!imageList || imageList.length === 0)) return

  // 如果没有 plotId，先创建
  if (!chatDetail.value.plotId) {
    try {
      const plotId = await createGroupPlot({
        groupId: props.groupInfo.id
      })
      chatDetail.value.plotId = plotId
      pagination.value.plotId = plotId
    } catch (e) {
      console.error('创建剧情失败', e)
      showToast({ message: '创建剧情失败', icon: 'none' })
      return
    }
  }

  userScrolled.value = false

  // 添加用户消息
  const userMsg = addUserMessage(content, imageList)

  // 添加 AI 消息占位
  addAIMessage({ roleName: '', avatarUrl: '' })

  // 发起请求
  startStream(content, imageList)
}

// 添加用户消息
function addUserMessage(content, imageList = []) {
  const userMsg = {
    id: 'user-' + Date.now(),
    senderType: 1,
    content,
    images: imageList.map(i => i.localUrl),
    time: Date.now()
  }
  msgList.value.push(userMsg)
  scrollToBottom()
  return userMsg
}

// 添加 AI 消息占位
function addAIMessage(roleInfo = {}) {
  const aiMsg = {
    id: 'ai-' + Date.now(),
    senderType: 2,
    content: '',
    htmlContent: '',
    thinkContent: '',
    thinkHtmlContent: '',
    mainContent: '',
    hasThinking: false,
    isThinking: false,
    loading: true,
    time: Date.now(),
    ...roleInfo
  }
  msgList.value.push(aiMsg)
  return aiMsg
}

// 群聊流式请求
function startStream(content, imageList = []) {
  isGenerating.value = true
  
  const fileKeys = imageList.map(i => i.fileKey)
  
  let updateTimer = null
  let pendingUpdate = false

  const flushUpdate = () => {
    if (pendingUpdate) {
      msgList.value = [...msgList.value]
      pendingUpdate = false
    }
  }

  const scheduleUpdate = () => {
    if (!updateTimer) {
      updateTimer = setTimeout(() => {
        flushUpdate()
        updateTimer = null
      }, 50)
    }
    pendingUpdate = true
  }

  let currentSpeakerIdx = -1

  const resolveRoleMeta = (rolesList, speakerName) => {
    const name = speakerName?.toLowerCase() || ''
    return rolesList.find(r => 
      r.name?.toLowerCase().includes(name) ||
      name.includes(r.name?.toLowerCase() || '')
    ) || rolesList[0] || {}
  }

  groupSendMessage(
    {
      groupId: props.groupInfo.id,
      userMessage: content || '',
      imageList: fileKeys,
      plotId: chatDetail.value.plotId
    },
    (eventData) => {
      const { msg, type, eventType } = eventData.payload || {}
      const actualType = eventType || type

      if (actualType === 'speaker_start') {
        const obj = typeof msg === 'string' ? JSON.parse(msg) : msg
        const meta = resolveRoleMeta(roles.value, obj.speakerName)
        const aiMsg = {
          id: obj.speakerId || 'ai-' + Date.now(),
          senderType: 2,
          content: '',
          htmlContent: '',
          thinkContent: '',
          thinkHtmlContent: '',
          mainContent: '',
          hasThinking: false,
          isThinking: false,
          loading: true,
          time: Date.now(),
          roleMeta: meta,
          roleName: meta.name,
          avatarUrl: meta.avatarUrl,
          groupRoleId: meta.id
        }
        msgList.value.push(aiMsg)
        currentSpeakerIdx = msgList.value.length - 1
        activeRoleId.value = meta.id || ''
        scheduleUpdate()
      } else if (actualType === 'text') {
        if (currentSpeakerIdx < 0) {
          addAIMessage()
          currentSpeakerIdx = msgList.value.length - 1
        }
        const cur = msgList.value[currentSpeakerIdx]
        if (cur && cur.senderType === 2) {
          cur.content = (cur.content || '') + (msg || '')
          cur.mainContent = cur.content
          cur.htmlContent = cur.content
          cur.isThinking = false
          scheduleUpdate()
        }
      } else if (actualType === 'thinking') {
        let target = currentSpeakerIdx >= 0 
          ? msgList.value[currentSpeakerIdx] 
          : msgList.value[msgList.value.length - 1]
        if (target && target.senderType === 2) {
          target.thinkContent = (target.thinkContent || '') + (msg || '')
          target.thinkHtmlContent = target.thinkContent
          target.isThinking = true
          target.hasThinking = true
          scheduleUpdate()
        }
      } else if (actualType === 'speaker_end') {
        for (let i = msgList.value.length - 1; i >= 0; i--) {
          const m = msgList.value[i]
          if (m.senderType === 2 && m.loading) {
            m.loading = false
            m.isThinking = false
            break
          }
        }
        currentSpeakerIdx = -1
        activeRoleId.value = ''
        scheduleUpdate()
      } else if (actualType === 'aiMessageId') {
        for (let i = msgList.value.length - 1; i >= 0; i--) {
          if (msgList.value[i].senderType === 2) {
            msgList.value[i].id = msg
            break
          }
        }
      } else if (actualType === 'userMessageId' && msgList.value.length >= 2) {
        const userMsg = msgList.value[msgList.value.length - 2]
        if (userMsg) userMsg.id = msg
      }

      if (!userScrolled.value) {
        scrollToBottom()
      }
    },
    true // isGroup = true
  )
    .then(() => {
      if (updateTimer) {
        clearTimeout(updateTimer)
        updateTimer = null
      }
      flushUpdate()

      msgList.value = msgList.value.map(m =>
        m.senderType === 2 && m.loading 
          ? { ...m, loading: false, isThinking: false } 
          : m
      )
      
      isGenerating.value = false
      activeRoleId.value = ''
      
      setTimeout(() => scrollToBottom(true), 50)
    })
    .catch((err) => {
      if (updateTimer) {
        clearTimeout(updateTimer)
        updateTimer = null
      }
      
      isGenerating.value = false
      activeRoleId.value = ''

      if (err?.code === 402) {
        showToast({ message: '能量不足', icon: 'none' })
      } else {
        showToast({ message: '群聊暂时不可用', icon: 'none' })
      }
    })
}

// 滚动到底部
function scrollToBottom(force = false) {
  const now = Date.now()
  
  if (!force) {
    if (_lastAutoScrollTime && now - _lastAutoScrollTime < 120) return
    if (_isAutoScrolling) return
  }

  _lastAutoScrollTime = now
  _isAutoScrolling = true

  nextTick(() => {
    const bottomEl = document.getElementById('bottom-anchor')
    if (bottomEl) {
      bottomEl.scrollIntoView({ behavior: force ? 'auto' : 'smooth' })
    }
    
    setTimeout(() => {
      _isAutoScrolling = false
    }, 300)
  })
}

// 滚动事件
function onScroll(e) {
  const target = e.target
  const scrollTop = target?.scrollTop || 0
  const scrollHeight = target?.scrollHeight || 0
  const clientHeight = target?.clientHeight || 0

  if (maskVisible.value) {
    hideMask()
  }

  if (isGenerating.value) {
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    if (distanceToBottom > 150 && !userScrolled.value) {
      userScrolled.value = true
    }
  }
}

// 刷新
async function onRefresh() {
  if (!pagination.value.plotId || !hasMore.value) {
    refreshing.value = false
    return
  }

  // TODO: 实现加载更多
  refreshing.value = false
}

// 蒙版
function onMaskShow({ show, buttonTop, buttonRight, messageId }) {
  if (show) {
    maskVisible.value = true
    maskButtonTop.value = buttonTop
    maskButtonRight.value = buttonRight
  } else {
    hideMask()
  }
}

function hideMask() {
  maskVisible.value = false
}

function stopPropagation(e) {
  e.stopPropagation()
}

// 键盘
function onKeyboardHeightChange(height) {
  keyboardHeight.value = height
  if (height > 0) {
    contentHeight.value = `calc(100% - ${height}px)`
    setTimeout(() => scrollToBottom(true), 400)
  } else {
    contentHeight.value = '100%'
  }
}

function onInputLineChange() {
  scrollToBottom()
}

function initKeyboardListener() {
  if (window.wx && window.wx.onKeyboardHeightChange) {
    window.wx.onKeyboardHeightChange((res) => {
      onKeyboardHeightChange(res.height || 0)
    })
  }
}

function removeKeyboardListener() {
  if (window.wx && window.wx.offKeyboardHeightChange) {
    window.wx.offKeyboardHeightChange()
  }
}
</script>

<style lang="scss" scoped>
.group-chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
  position: relative;
}

.role-bar {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: #fff;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid #f0f0f0;

  &::-webkit-scrollbar {
    display: none;
  }
}

.role-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  border-radius: 16rpx;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &.active {
    background: #fff5f0;
    border: 2px solid #FF5F15;
  }
}

.role-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  object-fit: cover;
}

.role-name {
  font-size: 22rpx;
  color: #333;
  max-width: 80rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 20rpx;
}

.message-item {
  margin-bottom: 8rpx;
}

.bottom-anchor {
  height: 20rpx;
}

.mask-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
}

.mask-buttons {
  position: fixed;
  right: 32rpx;
  z-index: 100;
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.15);
}

.mask-btn {
  padding: 16rpx 32rpx;
  font-size: 28rpx;
  color: #333;
  text-align: center;
  cursor: pointer;

  &:active {
    background: #f5f5f5;
  }
}
</style>
