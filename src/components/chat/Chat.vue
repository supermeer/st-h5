<template>
  <div class="chat-wrapper">
    <!-- 消息列表（让 window/document 提供滚动，iOS Safari 会自动收起地址栏） -->
    <div
      class="message-list"
      :class="{ 'scroll-animation': scrollAnimation }"
    >
      <!-- 顶部渐隐蒙版 -->
      <div v-if="isScrolledUp" class="top-fade-mask"></div>

      <!-- 剧情信息 -->
      <div v-if="sceneDisplay" class="scene-section">
        <div class="scene-label">世界观</div>
        <div class="scene-text" @click="toggleScene">
          {{ sceneDisplay }}
          <span v-if="sceneNeedFold" class="scene-toggle">
            {{ sceneExpanded ? '收起' : '展开' }}
          </span>
        </div>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="(msg, idx) in msgList"
        :key="msg.id || idx"
        :id="`msg-${msg.id}`"
        class="message-item"
      >
        <!-- AI 角色消息 -->
        <RoleMsg
          v-if="msg.senderType === 2"
          :message="msg"
          :role-detail="roleDetail"
          :group-detail="groupDetail"
          :plot-info="plotInfo"
          :is-latest="idx === msgList.length - 1"
          :disabled="isGenerating"
          @button-click="onButtonClick"
          @mask-show="onMaskShow"
          @retry="onRetryMessage"
          @role-click="onRoleClick"
        />

        <!-- 用户消息 -->
        <UserMsg
          v-else
          :message="msg"
          :disabled="isGenerating"
          @button-click="onButtonClick"
          @mask-show="onMaskShow"
          @retry="onRetryMessage"
        />
      </div>

      <!-- 底部锚点 -->
      <div id="bottom-anchor" class="bottom-anchor"></div>

      <!-- 底部留白，避免最后一条消息被浮动的 InputBox 遮挡 -->
      <div class="input-safe-area"></div>
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
        left: currentMessageType === 'user' ? 'auto' : maskButtonLeft + 'px',
        right: currentMessageType === 'user' ? maskButtonRight + 'px' : 'auto'
      }"
      @click.stop="stopPropagation"
    >
      <template v-if="currentMessageType === 'role'">
        <div
          class="mask-btn"
          data-action="rollback"
          @click="onMaskButtonClick"
        >回溯</div>
        <div
          class="mask-btn"
          data-action="newPlot"
          @click="onMaskButtonClick"
        >新剧情</div>
        <div
          class="mask-btn"
          data-action="copy"
          @click="onMaskButtonClick"
        >复制</div>
      </template>
      <template v-else>
        <div
          class="mask-btn"
          data-action="copy"
          @click="onMaskButtonClick"
        >复制</div>
      </template>
    </div>

    <!-- 自由复制弹窗 -->
    <van-dialog
      v-model:show="freeCopyVisible"
      title="复制内容"
      show-cancel-button
      @confirm="onFreeCopyConfirm"
    >
      <div class="free-copy-content">{{ freeCopyContent }}</div>
    </van-dialog>

    <!-- 输入框（fixed 浮动在底部，window/document 提供滚动） -->
    <div
      class="input-box-fixed"
      :class="{ 'with-keyboard': keyboardHeight > 0 }"
      :style="{ bottom: inputBoxBottom }"
    >
      <InputBox
        :plot-info="plotInfo"
        :role-info="roleInfo"
        :group-info="groupInfo"
        :disabled="isGenerating"
        :placeholder="inputPlaceholder"
        @send-message="onSendMessage"
        @keyboard-height-change="onKeyboardHeightChange"
        @input-line-change="onInputLineChange"
        @hide-tabbar="hideTabbar"
        @show-tabbar="showTabbar"
        @button-click="onInputButtonClick"
      />
    </div>

    <!-- 弹窗组件 -->
    <TipDialog ref="tipDialogRef" />
    <InputSheet ref="inputSheetRef" />
    <SelectSheet ref="selectSheetRef" />
    <StoryDialog ref="storyDialogRef" />
    <ModelSheet ref="modelSheetRef" />
    <PointsRechargeDialog ref="pointsRechargeDialogRef" />
    <ModelErrDialog ref="modelErrDialogRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import RoleMsg from './RoleMsg.vue'
import UserMsg from './UserMsg.vue'
import InputBox from './InputBox.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'
import InputSheet from '@/components/dialogs/InputSheet.vue'
import SelectSheet from '@/components/dialogs/SelectSheet.vue'
import StoryDialog from '@/components/dialogs/StoryDialog.vue'
import ModelSheet from '@/components/dialogs/ModelSheet.vue'
import PointsRechargeDialog from '@/components/dialogs/PointsRechargeDialog.vue'
import ModelErrDialog from '@/components/dialogs/ModelErrDialog.vue'

import {
  sendMessage,
  createPlot,
  getPlotMessage,
  rollbackPlotMessage,
  forkPlotFromMessage,
  saveUserMessage,
  createStory,
  inspirationReply,
  retellMessage,
  setCurrentMessage
} from '@/api/ai/chat'
import {
  getCharacterDetail,
  getCharacterDetailByParams,
  getCurrentPlotByCharacterId
} from '@/api/role'
import { getGroupDetailByParams, getCurrentPlotByGroupChatId } from '@/api/group'
import { getModelList, getGlobalModelId, setGlobalModel } from '@/api/usercenter'
import { useRouter } from 'vue-router'
import { formatMessage as formatMessageUtil } from '@/utils/msgHandler'
import { useBackgroundStore } from '@/store/background'

const props = defineProps({
  roleInfo: {
    type: Object,
    default: () => ({})
  },
  groupInfo: {
    type: Object,
    default: () => ({})
  },
  plotInfo: {
    type: Object,
    default: () => ({})
  },
  showBack: {
    type: Boolean,
    default: true
  },
  isShare: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'hideTabbar',
  'showTabbar',
  'retryMessage'
])

const router = useRouter()

// 全局背景 store：剧情背景图统一由 <AppBackground /> 渲染，这里只负责写入
const backgroundStore = useBackgroundStore()

// 状态
const msgList = ref([])
const roleDetail = ref({ name: '', avatarUrl: '', description: '' })
const groupDetail = ref({ name: '', avatarUrl: '', description: '', roles: [] })
const currentStoryDetail = ref({})
const chatDetail = ref({ plotId: null, updateTime: null })
const keyboardHeight = ref(0)
const scrollAnimation = ref(true)
const isGenerating = ref(false)
const userScrolled = ref(false)
const isScrolledUp = ref(false)
const maskVisible = ref(false)
const maskButtonTop = ref(0)
const maskButtonLeft = ref(0)
const maskButtonRight = ref(0)
const currentMaskMessageId = ref(null)
const currentMessageType = ref('role')
const freeCopyVisible = ref(false)
const freeCopyContent = ref('')
const refreshing = ref(false)
const hasMore = ref(true)
const sceneExpanded = ref(false)
const sceneNeedFold = ref(false)
const sceneDisplay = ref('')
const inputPlaceholder = ref('输入消息...')

// 分页
const pagination = ref({
  size: 10,
  current: 1,
  plotId: null
})

// 蒙版关闭中状态
const maskClosing = ref(false)

// Refs
const messageListRef = ref(null)
const tipDialogRef = ref(null)
const inputSheetRef = ref(null)
const selectSheetRef = ref(null)
const storyDialogRef = ref(null)
const modelSheetRef = ref(null)
const pointsRechargeDialogRef = ref(null)
const modelErrDialogRef = ref(null)

// 滚动相关
let _lastScrollTop = 0
let _lastAutoScrollTime = 0
let _isAutoScrolling = false
let _isLoadingMore = false // 防止 onRefresh 被并发触发
let _autoScrollTimer = null
let _maskEnableTimer = null
let _maskDisabledUntil = 0

// 计算属性
const isGroupChat = computed(() => props.plotInfo?.isGroupChat || !!props.groupInfo?.id)

// 初始化
onMounted(() => {
  getChatInfo()
  initKeyboardListener()
  // window scroll 监听：让 iOS Safari 在滚动消息列表时自动收起地址栏
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  removeKeyboardListener()
  window.removeEventListener('scroll', onScroll)
})

// 监听 roleInfo.id 变化（参照小程序 observers: { 'roleInfo.id' }）
watch(
  () => props.roleInfo?.id,
  (newVal) => {
    if (newVal) {
      getChatInfo()
    }
  }
)

// 监听 plotInfo 变化
watch(
  () => props.plotInfo?.id,
  (newVal) => {
    if (newVal) {
      pagination.value.plotId = newVal
      getMessageList()
    } else {
      // 没有 plotId 时清空消息
      msgList.value = []
      chatDetail.value = { ...chatDetail.value, plotId: null }
      pagination.value = { size: 10, current: 1, plotId: null }
    }
  }
)

// 获取聊天信息
async function getChatInfo() {
  try {
    const isGroup = isGroupChat.value
    let res

    if (isGroup) {
      res = await getGroupDetailByParams({ groupChatId: props.groupInfo.id })
      groupDetail.value = {
        ...groupDetail.value,
        ...res
      }
      if (res.defaultStoryDetail) {
        currentStoryDetail.value = {
          ...currentStoryDetail.value,
          storyId: res.defaultStoryId,
          ...res.defaultStoryDetail
        }
      }
    } else {
      res = await getCharacterDetailByParams({ characterId: props.roleInfo.id })
      roleDetail.value = {
        ...roleDetail.value,
        ...res
      }
      if (res.defaultStoryDetail) {
        currentStoryDetail.value = {
          ...currentStoryDetail.value,
          storyId: res.defaultStoryId,
          ...res.defaultStoryDetail
        }
      }
    }

    // 处理剧情信息
    const bg = res.backgroundImage || res.defaultStoryDetail?.defaultBackgroundImage || ''
    // 背景统一交给全局 <AppBackground /> 渲染（position: fixed 铺满视口）
    backgroundStore.setBg(bg)

    // 处理剧情文本折叠
    const scene = currentStoryDetail.value.scene || ''
    sceneNeedFold.value = scene.length > 60
    sceneDisplay.value = sceneNeedFold.value ? scene.slice(0, 60) + '…' : scene

    // 如果有默认消息
    if (currentStoryDetail.value.prologue) {
      const defaultMsg = {
        id: 'prologue-' + Date.now(),
        senderType: 2,
        content: currentStoryDetail.value.prologue,
        htmlContent: formatMessage(currentStoryDetail.value.prologue),
        loading: false,
        time: Date.now()
      }
      msgList.value = [defaultMsg]
      hasMore.value = false
    }

  } catch (e) {
    console.error('获取聊天信息失败', e)
  }
}

// 获取消息列表
async function getMessageList() {
  if (!pagination.value.plotId) {
    msgList.value = []
    return
  }

  try {
    const res = await getPlotMessage({
      size: pagination.value.size,
      current: pagination.value.current,
      plotId: pagination.value.plotId
    })

    let records = res.records || res || []
    if (!Array.isArray(records)) records = []

    // 格式化消息
    const messages = records.map(msg => ({
      ...msg,
      htmlContent: msg.senderType === 2 ? formatMessage(msg.content) : undefined,
      thinkHtmlContent: msg.senderType === 2 ? formatMessage(msg.reasoningContent || '') : undefined
    }))

    msgList.value = messages
    hasMore.value = messages.length >= pagination.value.size

    // 更新剧情ID
    if (res.plotId) {
      chatDetail.value.plotId = res.plotId
    }

    nextTick(() => scrollToBottom(true))
  } catch (e) {
    console.error('获取消息列表失败', e)
    msgList.value = []
  }
}

// 加载更多
async function onRefresh() {
  if (!pagination.value.plotId || !hasMore.value) {
    refreshing.value = false
    return
  }

  const nextPage = pagination.value.current + 1
  refreshing.value = true

  try {
    const res = await getPlotMessage({
      size: pagination.value.size,
      current: nextPage,
      plotId: pagination.value.plotId
    })

    let records = res.records || res || []
    if (!Array.isArray(records)) records = []

    if (records.length === 0) {
      hasMore.value = false
    } else {
      const messages = records.map(msg => ({
        ...msg,
        htmlContent: msg.senderType === 2 ? formatMessage(msg.content) : undefined
      }))

      const topMsg = msgList.value[0]
      msgList.value = [...messages, ...msgList.value]
      pagination.value.current = res.current || nextPage
      hasMore.value = messages.length >= pagination.value.size

      // 滚动回原位置
      nextTick(() => {
        if (topMsg?.id) {
          scrollToView(`msg-${topMsg.id}`)
        }
      })
    }
  } catch (e) {
    console.error('加载更多失败', e)
  } finally {
    refreshing.value = false
  }
}

// 发送消息
async function onSendMessage({ content, imageList = [] }) {
  if (!content && (!imageList || imageList.length === 0)) return
  
  // 如果没有 plotId，先创建
  if (!chatDetail.value.plotId) {
    try {
      const plotId = await createPlot({
        characterId: props.roleInfo?.id,
        groupChatId: props.groupInfo?.id,
        storyId: currentStoryDetail.value.storyId
      })
      chatDetail.value.plotId = plotId
      pagination.value.plotId = plotId
    } catch (e) {
      console.error('创建剧情失败', e)
      showToast({ message: '创建剧情失败', icon: 'none' })
      return
    }
  }

  // 重置用户滚动状态
  userScrolled.value = false

  // 添加用户消息
  const userMsg = addUserMessage(content, imageList)

  // 添加 AI 消息占位
  addAIMessage()

  // 发起请求
  generateRequest(content, imageList)
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

// 流式请求
function generateRequest(content, imageList = []) {
  isGenerating.value = true
  
  const fileKeys = imageList.map(i => i.fileKey)
  
  // 防抖更新
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

  sendMessage(
    {
      userMessage: content || '',
      imageList: fileKeys,
      plotId: chatDetail.value.plotId
    },
    (eventData) => {
      const { msg, type, url, payload } = eventData.payload || {}
      const latestMsg = msgList.value[msgList.value.length - 1]

      if (!latestMsg) return

      if (type === 'text') {
        latestMsg.content = (latestMsg.content || '') + (msg || '')
        latestMsg.htmlContent = formatMessage(latestMsg.content)
        latestMsg.mainContent = latestMsg.content
        latestMsg.isThinking = false
        scheduleUpdate()
      }

      if (type === 'thinking') {
        latestMsg.thinkContent = (latestMsg.thinkContent || '') + (msg || '')
        latestMsg.thinkHtmlContent = formatMessage(latestMsg.thinkContent)
        latestMsg.isThinking = true
        latestMsg.hasThinking = true
        scheduleUpdate()
      }

      if (type === 'aiMessageId') {
        latestMsg.id = msg
      }

      if (type === 'userMessageId' && msgList.value.length >= 2) {
        const userMsg = msgList.value[msgList.value.length - 2]
        if (userMsg) userMsg.id = msg
      }

      if (type === 'speaker_start') {
        const obj = typeof msg === 'string' ? JSON.parse(msg) : msg
        latestMsg.avatarUrl = obj.speakerAvatar || ''
        latestMsg.roleName = obj.speakerName || ''
        scheduleUpdate()
      }

      if (type === 'speaker_end') {
        latestMsg.loading = false
        latestMsg.isThinking = false
        scheduleUpdate()
      }

      if (type === 'modelStatus') {
        const obj = typeof msg === 'string' ? JSON.parse(msg) : msg
        handleModelStatus(obj)
      }

      if (!userScrolled.value) {
        scrollToBottom()
      }
    },
    isGroupChat.value
  )
    .then(() => {
      if (updateTimer) {
        clearTimeout(updateTimer)
        updateTimer = null
      }
      flushUpdate()

      const lastMsg = msgList.value[msgList.value.length - 1]
      if (lastMsg) {
        lastMsg.loading = false
        lastMsg.isThinking = false
      }
      
      isGenerating.value = false
      msgList.value = [...msgList.value]

      if (!userScrolled.value) {
        setTimeout(() => scrollToBottom(true), 50)
      }
    })
    .catch((err) => {
      if (updateTimer) {
        clearTimeout(updateTimer)
        updateTimer = null
      }
      flushUpdate()

      // 删除最后一条 AI 消息
      if (msgList.value.length > 0 && msgList.value[msgList.value.length - 1].senderType === 2) {
        msgList.value.pop()
      }

      isGenerating.value = false

      if (err?.code === 402) {
        pointsRechargeDialogRef.value?.show()
      } else {
        showToast({ message: err?.message || '生成失败', icon: 'none' })
      }
    })
}

// 处理模型状态
function handleModelStatus(obj) {
  const { status } = obj
  
  if (status === 1) {
    modelErrDialogRef.value?.show({
      content: '抱歉！我走神啦！\n原谅我这一次好不好呀~',
      confirmText: '再给你一次机会',
      onConfirm: () => onRetryMessage()
    })
  }
  
  if (status === 0) {
    modelErrDialogRef.value?.show({
      content: '抱歉！我的大脑宕机了！\n请为我换个大脑吧~',
      confirmText: '切换对话模型',
      onConfirm: async () => {
        try {
          const [id, list] = await Promise.all([getGlobalModelId(), getModelList()])
          modelSheetRef.value?.show({
            modelOptions: list,
            currentValue: id,
            onConfirm: () => {
              showToast({ message: '保存成功！', icon: 'none' })
            }
          })
        } catch (e) {
          console.error('获取模型列表失败', e)
        }
      }
    })
  }
}

// 滚动到底部（用 window.scrollTo，iOS Safari 会响应并收起地址栏）
function scrollToBottom(force = false) {
  const now = Date.now()

  if (!force) {
    if (_lastAutoScrollTime && now - _lastAutoScrollTime < 120) return
    if (_isAutoScrolling) return
  }

  _lastAutoScrollTime = now
  _isAutoScrolling = true

  nextTick(() => {
    // 计算底部位置：document.documentElement.scrollHeight - window.innerHeight
    const docEl = document.documentElement
    const scrollBody = docEl.scrollHeight || document.body.scrollHeight
    const viewport = window.innerHeight
    const targetTop = Math.max(0, scrollBody - viewport)
    window.scrollTo({ top: targetTop, behavior: force ? 'auto' : 'smooth' })

    setTimeout(() => {
      _isAutoScrolling = false
    }, 300)
  })
}

// 滚动到指定位置
function scrollToView(id) {
  nextTick(() => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView()
    }
  })
}

// 滚动事件处理（监听 window 滚动，让 iOS Safari 收起地址栏）
function onScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
  const clientHeight = window.innerHeight

  // 隐藏蒙版
  if (maskVisible.value) {
    hideMask()
  }

  // 检测滚动状态
  handleScrollState(scrollTop, scrollHeight, clientHeight)
}

// 处理滚动状态
function handleScrollState(scrollTop, scrollHeight, viewHeight) {
  const isScrollable = scrollHeight > viewHeight + 1

  if (!isScrollable) {
    setMaskState(false)
    return
  }

  const delta = scrollTop - _lastScrollTop

  // 如果是自动滚动，不处理
  if (_isAutoScrolling) {
    setMaskState(false)
    _lastScrollTop = scrollTop
    return
  }

  // 顶部阈值
  if (scrollTop <= 8) {
    setMaskState(false)
    // 触顶自动加载更多（参照小程序下拉刷新行为）
    if (hasMore.value && !refreshing.value && !_isLoadingMore) {
      _isLoadingMore = true
      onRefresh().finally(() => {
        _isLoadingMore = false
      })
    }
  } else if (Math.abs(delta) > 5) {
    if (delta > 0) {
      setMaskState(true)
    } else {
      setMaskState(false)
    }
  }

  _lastScrollTop = scrollTop

  // 检测用户手动滚动
  if (isGenerating.value) {
    const distanceToBottom = scrollHeight - scrollTop - viewHeight
    if (distanceToBottom > 150 && !userScrolled.value) {
      userScrolled.value = true
    }
  }
}

// 设置蒙版状态
function setMaskState(target) {
  if (target) {
    if (_maskDisabledUntil && Date.now() < _maskDisabledUntil) return
    
    if (_maskEnableTimer) clearTimeout(_maskEnableTimer)
    _maskEnableTimer = setTimeout(() => {
      _maskEnableTimer = null
      if (!isScrolledUp.value) isScrolledUp.value = true
    }, 150)
  } else {
    if (_maskEnableTimer) {
      clearTimeout(_maskEnableTimer)
      _maskEnableTimer = null
    }
    if (isScrolledUp.value) isScrolledUp.value = false
  }
}

// 蒙版显示
function onMaskShow({ show, buttonTop, buttonLeft, buttonRight, messageId, messageType }) {
  if (show) {
    maskVisible.value = true
    maskButtonTop.value = buttonTop
    maskButtonLeft.value = buttonLeft || 0
    maskButtonRight.value = buttonRight || 0
    currentMaskMessageId.value = messageId
    currentMessageType.value = messageType || 'role'
  } else {
    hideMask()
  }
}

// 隐藏蒙版
function hideMask() {
  if (!maskVisible.value || maskClosing.value) return
  
  maskClosing.value = true
  setTimeout(() => {
    maskVisible.value = false
    maskClosing.value = false
    currentMaskMessageId.value = null
  }, 200)
}

// 蒙版按钮点击
function onMaskButtonClick(e) {
  const action = e.currentTarget.dataset.action
  hideMask()
  
  if (action === 'rollback') {
    handleRollback()
  } else if (action === 'newPlot') {
    handleNewPlot()
  } else if (action === 'copy') {
    handleCopy()
  }
}

// 回溯
async function handleRollback() {
  const msgId = currentMaskMessageId.value
  
  tipDialogRef.value?.show({
    content: '回溯后，该条消息之后的对话将被清除，且不可撤回。',
    cancelText: '取消',
    confirmText: '确认',
    onConfirm: async () => {
      try {
        await rollbackPlotMessage({
          includeCurrent: false,
          messageId: msgId
        })
        await getMessageList()
        showToast({ message: '回溯成功', icon: 'success' })
      } catch (e) {
        console.error('回溯失败', e)
        showToast({ message: '回溯失败', icon: 'none' })
      }
    }
  })
}

// 新剧情
function handleNewPlot() {
  inputSheetRef.value?.show({
    title: '创建新剧情',
    label: '剧情名称',
    placeholder: '请输入',
    onConfirm: async (value) => {
      try {
        const plotId = await createPlot({
          characterId: props.roleInfo?.id,
          groupChatId: props.groupInfo?.id,
          title: value
        })
        chatDetail.value.plotId = plotId
        pagination.value.plotId = plotId
        await getMessageList()
        showToast({ message: '创建成功', icon: 'success' })
      } catch (e) {
        console.error('创建剧情失败', e)
        showToast({ message: '创建失败', icon: 'none' })
      }
    }
  })
}

// 复制
async function handleCopy() {
  const msg = msgList.value.find(m => m.id === currentMaskMessageId.value)
  if (!msg) return

  try {
    await navigator.clipboard.writeText(msg.content)
    showToast({ message: '复制成功', icon: 'success' })
  } catch (e) {
    console.error('复制失败', e)
    showToast({ message: '复制失败', icon: 'none' })
  }
}

// 自由复制
function onFreeCopyConfirm() {
  // 已通过对话框内置复制
}

// 按钮点击处理
function onButtonClick({ action, current, messageId, include }) {
  switch (action) {
    case 'like':
      // TODO: 实现点赞
      break
    case 'dislike':
      // TODO: 实现点踩
      break
    case 'retry':
      handleRetry(messageId)
      break
    case 'continue':
      handleContinue(messageId)
      break
    case 'copy':
      handleCopy()
      break
    case 'rollback':
      handleRollback()
      break
    case 'newPlot':
      handleNewPlot()
      break
    case 'changePlot':
      handleChangePlot()
      break
  }
}

// 重试
function handleRetry(messageId) {
  selectSheetRef.value?.show({
    mode: 'retry',
    title: '重说',
    messageId,
    plotId: chatDetail.value.plotId,
    onUse: async (result) => {
      await getMessageList()
    }
  })
}

// 继续生成
function handleContinue(messageId) {
  userScrolled.value = false
  
  // TODO: 实现继续生成
  showToast({ message: '继续生成中...', icon: 'none' })
}

// 角色点击
function onRoleClick(msg) {
  // TODO: 实现角色详情跳转
}

// 切换剧情
function handleChangePlot() {
  storyDialogRef.value?.show({
    roles: groupDetail.value.characterInfos,
    onConfirm: async (data) => {
      try {
        const plotId = await createStory({
          ...data,
          groupChatId: props.groupInfo?.id
        })
        chatDetail.value.plotId = plotId
        pagination.value.plotId = plotId
        await getMessageList()
      } catch (e) {
        console.error('创建剧情失败', e)
      }
    }
  })
}

// 输入框按钮点击
function onInputButtonClick({ action }) {
  if (action === 'restart') {
    handleNewPlot()
  } else if (action === 'changePlot') {
    handleChangePlot()
  }
}

// 重试消息
function onRetryMessage({ messageId } = {}) {
  // TODO: 实现重试逻辑
}

// 键盘高度变化
function onKeyboardHeightChange(height) {
  keyboardHeight.value = height
  if (height > 0) {
    // 键盘弹出时滚动到底部，确保最新消息可见
    setTimeout(() => scrollToBottom(true), 400)
  }
}

// 输入行变化
function onInputLineChange() {
  scrollToBottom()
}

// 键盘监听
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

// 阻止事件冒泡
function stopPropagation(e) {
  e.stopPropagation()
}

// 折叠/展开剧情文本
function toggleScene() {
  sceneExpanded.value = !sceneExpanded.value
  const scene = currentStoryDetail.value.scene || ''
  sceneDisplay.value = sceneNeedFold.value && !sceneExpanded.value 
    ? scene.slice(0, 60) + '…' 
    : scene
}

// 维护本地 tabbarVisible，响应 Chat → InputBox 的 hideTabbar / showTabbar 事件
const tabbarVisible = ref(true)

// 隐藏/显示 TabBar
function hideTabbar() {
  tabbarVisible.value = false
  emit('hideTabbar')
  // TabBar 隐藏后展开的工具栏/灵感面板需要滚动到底部保证最新消息可见
  nextTick(() => {
    setTimeout(() => scrollToBottom(true), 50)
  })
}

function showTabbar() {
  tabbarVisible.value = true
  emit('showTabbar')
}

// 计算 InputBox 的 bottom：键盘弹起时用键盘高度，否则交给浏览器解析
// CSS 变量 --tabbar-height-safearea（包含 vw 与 env()，JS 端无法直接 parseFloat）。
const inputBoxBottom = computed(() => {
  if (keyboardHeight.value > 0) {
    return `${keyboardHeight.value}px`
  }
  return tabbarVisible.value ? 'var(--tabbar-height-safearea)' : '0'
})

// 格式化消息（HTML 转换），使用完整的 msgHandler（参照小程序 utils/msgHandler.js）
function formatMessage(content) {
  try {
    return formatMessageUtil(content)
  } catch (e) {
    console.error('formatMessage failed', e)
    // 退化：仅做最小化转义
    if (!content) return ''
    return String(content)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
  }
}
</script>

<style lang="scss" scoped>
.chat-wrapper {
  position: relative;
  // 不再限制高度，让内容自然撑开；window/document 提供滚动
  min-height: 100vh;
}

.message-list {
  // 不再 overflow-y:auto，让 window/document 提供滚动，让 iOS Safari 自动收起地址栏
  padding-bottom: 20rpx;

  &.scroll-animation {
    scroll-behavior: smooth;
  }
}

// 顶部"加载更多"提示条（已移除视觉提示，仅在 handleScrollState 中触发）


.bottom-anchor {
  height: 20rpx;
}

// 底部安全区，给浮动的输入框留位置，避免最后一条消息被遮挡
.input-safe-area {
  // InputBox 默认高度（~140px）+ TabBar 高度（CSS 变量）
  // TabBar 隐藏时不会增加 input-box-fixed 的 bottom，但仍需保留 InputBox 高度的安全区
  height: calc(280rpx + var(--tabbar-height-safearea, 0px));
}

// 输入框固定在底部（fixed 布局）
.input-box-fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0; // 默认 0，键盘弹出时通过 inline style 设为键盘高度
  // CustomTabBar 的 z-index 是 999，InputBox 必须在它之上
  // 否则聊天输入框会被底部导航栏遮挡
  z-index: 1000;
  // InputBox 自带半透明背景（rgba(255,255,255,0.2)），但容器本身需要不透明背景
  // 才能在视觉上盖住下面的 TabBar 区域（TabBar 区域是 InputBox 容器的一部分，
  // 因为 InputBox 的 bottom 在 TabBar 可见时设为了 var(--tabbar-height-safearea)，
  // 容器底部会延伸到 TabBar 上方）
  // background: #1f1f1f; // 与 Home.vue 的背景色保持一致
  // 默认保留安全区
  // padding-bottom: env(safe-area-inset-bottom);
  transition: bottom 0.2s ease-out;

  // 键盘弹起时，不再保留底部安全区（已被键盘盖住）
  &.with-keyboard {
    padding-bottom: 0;
  }
}

.top-fade-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 200rpx;
  background: linear-gradient(to bottom, rgba(245, 245, 245, 1), rgba(245, 245, 245, 0));
  z-index: 10;
  pointer-events: none;
}

.scene-section {
  padding: 24rpx 32rpx;
  background: #fff;
  margin-bottom: 16rpx;
}

.scene-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.scene-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.scene-toggle {
  color: #FF5F15;
  margin-left: 16rpx;
  cursor: pointer;
}

.message-item {
  margin-bottom: 8rpx;
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
  display: flex;
  flex-direction: column;
  gap: 8rpx;
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
  border-radius: 8rpx;
  cursor: pointer;
  white-space: nowrap;
  
  &:active {
    background: #f5f5f5;
  }
}

.free-copy-content {
  padding: 32rpx;
  font-size: 28rpx;
  line-height: 1.6;
  max-height: 400rpx;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
