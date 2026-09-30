<template>
  <div class="input-box-container" :class="{ disabled }">
    <!-- 禁用状态遮罩层：统一拦截所有交互 -->
    <div v-if="disabled" class="disabled-mask" @click="onDisabledTap"></div>

    <!-- 默认态（inputType=0）：键盘图标 + 占位文字 + 灵感 + + -->
    <div v-if="inputType === 0" class="input-box">
      <!-- 键盘图标，点击切换到输入态 -->
      <img
        class="input-box-image icon-image"
        src="/static/chat/jianpan.png"
        data-type="1"
        @click="changeInputType"
        alt="键盘"
      />
      <!-- 占位文字，点击进入输入态 -->
      <div
        class="input-box-text"
        data-type="1"
        @click="changeInputType"
      >对ta说</div>
      <!-- 灵感按钮 -->
      <img
        v-if="!showInspiration"
        class="input-box-image"
        src="/static/chat/linggan.png"
        @click="onShowInspiration"
        alt="灵感"
      />
      <img
        v-else
        class="input-box-image"
        src="/static/chat/linggan_active.png"
        @click="onShowInspiration"
        alt="灵感"
      />
      <!-- 工具板开关 -->
      <img
        v-if="!showBoard"
        class="input-box-image"
        src="/static/chat/add.png"
        @click="onShowBoard"
        alt="更多"
      />
      <img
        v-else
        class="input-box-image"
        src="/static/chat/add_active.png"
        @click="onShowBoard"
        alt="更多"
      />
    </div>

    <!-- 输入态（inputType=1）：textarea + 灵感 + add/send 切换 -->
    <div v-if="inputType === 1" class="input-box-input">
      <textarea
        ref="textareaRef"
        v-model="inputValue"
        class="input-box-textarea"
        :placeholder="placeholder"
        :maxlength="1000"
        :style="{ maxHeight: `${maxHeight}px` }"
        rows="1"
        @input="onInput"
        @blur="onInputBlur"
        @keydown.enter.exact.prevent="onEnterSend"
      />
      <div class="bottom-line">
        <img
          v-if="!showInspiration"
          class="input-box-image"
          src="/static/chat/linggan.png"
          @click="onShowInspiration"
          alt="灵感"
        />
        <img
          v-else
          class="input-box-image"
          src="/static/chat/linggan_active.png"
          @click="onShowInspiration"
          alt="灵感"
        />
        <div class="icon-wrapper">
          <!-- add 图标：有文字时收起 -->
          <div
            class="icon-item icon-add-wrapper"
            :style="iconAddVisible"
          >
            <img
              class="input-box-image"
              src="/static/chat/add.png"
              @click="onShowBoard"
              alt="更多"
            />
          </div>
          <!-- send 图标：无文字时收起 -->
          <div
            class="icon-item icon-send-wrapper"
            :style="iconSendVisible"
            @click="onSend"
          >
            <img
              class="input-box-image"
              src="/static/chat/send.png"
              alt="发送"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 灵感面板 -->
    <div v-if="showInspiration" class="input-box-inspiration">
      <div class="input-box-inspiration-title">
        灵感对话
        <span class="icon-btn" @click="onRefreshInspiration">换一批</span>
      </div>
      <!-- 加载中 -->
      <div v-if="inspirationLoading" class="input-box-inspiration-loading">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
      </div>
      <!-- 空状态 -->
      <div v-else-if="inspirationEmpty" class="input-box-inspiration-empty">
        <span>暂时没有灵感，尝试换一句话或多聊几句吧～</span>
      </div>
      <!-- 列表 -->
      <div v-else class="inspiration-list">
        <div
          v-for="(item, idx) in inspirationList"
          :key="idx"
          class="input-box-inspiration-item"
          @click="onInspirationTap(item)"
        >
          <span class="inspiration-item-text">{{ item }}</span>
          <span class="icon-btn edit-icon" @click.stop="onEditInspiration(item)">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </span>
        </div>
      </div>
    </div>

    <!-- 底部工具板 -->
    <div v-if="showBoard" class="input-box-board">
      <div class="input-box-board-item" @click="onRestart">
        <img class="board-box-image" src="/static/chat/chongxinkaishi.png" alt="重新开始" />
        <span>重新开始</span>
      </div>
      <div class="input-box-board-item" @click="onPlotList">
        <img class="board-box-image" src="/static/chat/juqing.png" alt="其他剧情" />
        <span>其他剧情</span>
      </div>
      <!-- 分享：H5 走浏览器原生分享 -->
      <div class="input-box-board-item" @click="onShare">
        <img class="board-box-image" src="/static/chat/fenxiang.png" alt="分享" />
        <span>分享</span>
      </div>
      <!-- 联系客服 -->
      <div class="input-box-board-item" @click="onContactService">
        <img class="board-box-image" src="/static/chat/kf.png" alt="联系客服" />
        <span>联系客服</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { showToast, showDialog } from 'vant'

const props = defineProps({
  plotInfo: {
    type: Object,
    default: () => ({})
  },
  roleInfo: {
    type: Object,
    default: () => ({})
  },
  groupInfo: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '发送消息，环境、动作等可写在括号里'
  }
})

const emit = defineEmits([
  'sendMessage',
  'keyboardHeightChange',
  'inputLineChange',
  'hideTabbar',
  'showTabbar',
  'buttonClick'
])

// 状态
const inputType = ref(0) // 0：默认，1：输入
const inputValue = ref('')
const showInspiration = ref(false)
const inspirationList = ref([])
const inspirationLoading = ref(false)
const inspirationEmpty = ref(false)
const showBoard = ref(false)
const maxHeight = ref(150) // textarea 最大高度（rpx）

const textareaRef = ref(null)

// 自适应 textarea 高度（PC/移动通用，模仿小程序 textarea autosize）
function autoResizeTextarea() {
  if (!textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  // 让浏览器根据 scrollHeight 计算所需高度
  const next = Math.min(textareaRef.value.scrollHeight, maxHeight.value)
  textareaRef.value.style.height = `${next}px`
}

const canSend = computed(() => !!inputValue.value.trim() && !props.disabled)

const hasText = computed(() => inputValue.value.length > 0)

// 图标显隐样式（add 与 send 二选一）
const iconAddVisible = computed(() => ({
  opacity: hasText.value ? 0 : 1,
  pointerEvents: hasText.value ? 'none' : 'auto'
}))

const iconSendVisible = computed(() => ({
  opacity: hasText.value ? 0 : 1,
  pointerEvents: hasText.value ? 'none' : 'auto'
}))

// 通用：收起面板并通知父组件恢复 tabbar
function closePanelsAndShowTabbar() {
  showBoard.value = false
  showInspiration.value = false
  emit('showTabbar')
}

// 禁用状态点击
function onDisabledTap() {
  showToast({ message: '对话生成中，请稍候...', type: 'warning', duration: 1500 })
}

// 切换输入模式
async function changeInputType(e) {
  const type = Number(e?.currentTarget?.dataset?.type ?? e)
  if (type === inputType.value) return
  inputType.value = type
  showBoard.value = false
  showInspiration.value = false
  emit('showTabbar')
  if (type === 1) {
    await nextTick()
    // 让 textarea 自动聚焦
    textareaRef.value?.focus?.()
    autoResizeTextarea()
  }
}

// 输入态失焦：回到默认态（参照小程序 onInputBlur 行为）
function onInputBlur() {
  inputType.value = 0
  emit('keyboardHeightChange', 0)
}

// 文本输入
function onInput() {
  emit('inputLineChange')
  autoResizeTextarea()
}

// 回车发送（仅在非 shift+enter 时）
function onEnterSend() {
  if (canSend.value) {
    onSend()
  }
}

// 发送
function onSend(ctx) {
  const content = inputValue.value || ctx || ''
  if (!content.trim()) {
    showToast('请输入内容')
    return
  }
  emit('sendMessage', {
    content: content.trim(),
    imageList: []
  })
  inputValue.value = ''
  // 复位到默认态
  inputType.value = 0
  emit('keyboardHeightChange', 0)
}

// 灵感面板
async function onShowInspiration() {
  if (showInspiration.value) {
    showInspiration.value = false
    emit('showTabbar')
    return
  }
  showInspiration.value = true
  showBoard.value = false
  inspirationLoading.value = true
  inspirationEmpty.value = false
  inspirationList.value = []
  emit('hideTabbar')
  await loadInspiration()
}

function onRefreshInspiration() {
  inspirationLoading.value = true
  inspirationEmpty.value = false
  inspirationList.value = []
  loadInspiration()
}

async function loadInspiration() {
  try {
    const { inspirationReply } = await import('@/api/ai/chat')
    const res = await inspirationReply({
      plotId: props.plotInfo?.id,
      groupId: props.groupInfo?.id,
      characterId: props.roleInfo?.id
    })
    if (!res) {
      inspirationLoading.value = false
      inspirationEmpty.value = true
      inspirationList.value = []
      return
    }
    const arr = typeof res === 'string' ? JSON.parse(res) : res
    inspirationList.value = arr || []
    inspirationEmpty.value = !arr || arr.length === 0
    inspirationLoading.value = false
  } catch (e) {
    console.error('加载灵感失败', e)
    inspirationLoading.value = false
    inspirationEmpty.value = true
  }
}

// 点击灵感文本 → 直接发送
function onInspirationTap(item) {
  showInspiration.value = false
  emit('showTabbar')
  onSend(item)
}

// 点击编辑图标 → 填入到输入框并切到输入态
async function onEditInspiration(item) {
  showInspiration.value = false
  inputValue.value = item
  emit('showTabbar')
  inputType.value = 1
  await nextTick()
  textareaRef.value?.focus?.()
  autoResizeTextarea()
}

// 工具板
function onShowBoard() {
  if (showBoard.value) {
    showBoard.value = false
    emit('showTabbar')
    return
  }
  showBoard.value = true
  showInspiration.value = false
  emit('hideTabbar')
}

function onRestart() {
  closePanelsAndShowTabbar()
  emit('buttonClick', { action: 'restart' })
}

function onPlotList() {
  closePanelsAndShowTabbar()
  emit('buttonClick', { action: 'changePlot' })
}

function onShare() {
  closePanelsAndShowTabbar()
  // H5 调用浏览器原生分享能力（如果支持），否则降级为复制链接
  const shareData = {
    title: document.title || '对话',
    text: '推荐一款好玩的AI剧情对话',
    url: window.location.href
  }
  if (navigator.share) {
    navigator.share(shareData).catch(() => {
      // 用户取消或失败 → 降级复制
      fallbackCopyLink()
    })
  } else {
    fallbackCopyLink()
  }
}

function fallbackCopyLink() {
  const url = window.location.href
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(
      () => showToast('链接已复制，去分享给好友吧'),
      () => showToast('复制失败，请手动复制地址栏链接')
    )
  } else {
    showToast('请手动复制地址栏链接进行分享')
  }
}

function onContactService() {
  closePanelsAndShowTabbar()
  // H5 暂时用 dialog 提示，落地联系客服请接入 IM 客服 SDK
  showDialog({
    title: '联系客服',
    message: '工作时间：9:00 - 22:00\n您也可以发送邮件至 support@example.com',
    confirmButtonText: '我知道了'
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.input-box-container {
  padding: 20rpx 32rpx;
  position: relative;
  transition: height 0.3s ease-out;
}

.disabled-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 45rpx;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: maskFadeIn 0.25s ease;
  cursor: not-allowed;
}

@keyframes maskFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// 默认态输入条
.input-box {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 45rpx;
  height: 90rpx;
  padding: 0 20rpx;
  animation: fadeInUp 0.3s ease-out;
  transition: background 0.3s ease;
}

@keyframes fadeInUp {
  from { opacity: 0; }
  to { opacity: 1; }
}

// 灵感图标：有一组，点击切换
.input-box-image {
  width: 50rpx;
  height: 50rpx;
  transition: transform 0.2s ease, opacity 0.2s ease;
  cursor: pointer;

  &:active {
    transform: scale(0.9);
    opacity: 0.8;
  }

  // PC 浏览器 hover 反馈
  @media (hover: hover) {
    &:hover {
      opacity: 0.85;
    }
  }
}

// 在 .input-box 内：第二个图标（即 linggan）距 + 图标 20rpx
.input-box .input-box-image:nth-of-type(2) {
  margin-right: 20rpx;
}

// 在 .icon-item 包裹下的图片，自身不响应点击（外层接管）
.icon-item .input-box-image {
  cursor: default;
}

// 键盘图标
.icon-image {
  flex-shrink: 0;
}

.input-box-text {
  flex-grow: 1;
  font-size: 32rpx;
  color: #ddd;
  font-weight: bold;
  margin: 0 14rpx;
  height: 100%;
  line-height: 90rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

// 输入态
.input-box-input {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 30rpx;
  padding: 12rpx 20rpx;
  animation: fadeInScale 0.3s ease-out;
  transition: height 0.2s ease-out, max-height 0.4s ease-out;
}

@keyframes fadeInScale {
  from { opacity: 0; }
  to { opacity: 1; }
}

.input-box-textarea {
  width: 100%;
  background-color: transparent;
  padding: 0;
  color: #fff;
  font-size: 32rpx;
  line-height: 1.5;
  border: none;
  outline: none;
  resize: none;
  display: block;
  transition: height 0.2s ease-out;
  font-family: inherit;
  // 移除 PC 浏览器 textarea 聚焦边框
  &:focus,
  &:focus-visible {
    outline: none;
    border: none;
    box-shadow: none;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.bottom-line {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20rpx;
  margin-top: 20rpx;
}

.icon-wrapper {
  position: relative;
  width: 50rpx;
  height: 50rpx;
}

.icon-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 50rpx;
  height: 50rpx;
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-send-wrapper {
  transform: scale(0.8);
}

// 灵感面板
.input-box-inspiration {
  margin-top: 20rpx;
  padding: 0 20rpx;
  max-height: 400rpx;
  overflow-y: auto;
  animation: panelSlideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes panelSlideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-box-inspiration-title {
  font-size: 28rpx;
  color: #bbb;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.inspiration-list {
  display: flex;
  flex-direction: column;
}

.input-box-inspiration-title .icon-btn {
  margin-left: auto;
  color: #00C96B;
  font-size: 26rpx;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:active {
    transform: rotate(180deg);
  }
}

.input-box-inspiration-item {
  font-size: 28rpx;
  color: #fff;
  margin-bottom: 28rpx;
  background: rgba(255, 255, 255, 0.19);
  padding: 20rpx;
  border-radius: 20rpx;
  letter-spacing: 0.8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  animation: inspirationItemFadeIn 0.4s ease backwards;
}

.input-box-inspiration-item:nth-child(1) { animation-delay: 0.05s; }
.input-box-inspiration-item:nth-child(2) { animation-delay: 0.1s; }
.input-box-inspiration-item:nth-child(3) { animation-delay: 0.15s; }
.input-box-inspiration-item:nth-child(4) { animation-delay: 0.2s; }

@keyframes inspirationItemFadeIn {
  from {
    opacity: 0;
    transform: translateX(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.input-box-inspiration-item:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.31);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
}

.inspiration-item-text {
  flex: 1;
  margin-right: 12rpx;
  word-break: break-all;
}

.edit-icon {
  color: #fff;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

// 加载中
.input-box-inspiration-loading,
.input-box-inspiration-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  height: 160rpx;
  color: #fff;
  animation: emptyFadeIn 0.4s ease;
}

@keyframes emptyFadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.loading-dot {
  width: 20rpx;
  height: 20rpx;
  background: #fff;
  border-radius: 50%;
  margin: 0 10rpx;
  animation: loadingBounce 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loadingBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

// 底部工具板
.input-box-board {
  margin-top: 20rpx;
  padding: 0 20rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  animation: panelSlideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-box-board-item {
  display: inline-flex;
  width: calc(25% - 20rpx);
  height: 142rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.12);
  margin: 20rpx 10rpx;
  border-radius: 28rpx;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, box-shadow 0.2s ease;
  animation: boardItemPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.input-box-board-item:nth-child(1) { animation-delay: 0.05s; }
.input-box-board-item:nth-child(2) { animation-delay: 0.1s; }
.input-box-board-item:nth-child(3) { animation-delay: 0.15s; }
.input-box-board-item:nth-child(4) { animation-delay: 0.2s; }

@keyframes boardItemPop {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.input-box-board-item:active {
  background: rgba(255, 255, 255, 0.37);
  transform: scale(0.95);
  box-shadow: 0 4rpx 20rpx rgba(255, 255, 255, 0.15);
}

.input-box-board-item span,
.input-box-board-item text {
  font-size: 24rpx;
  color: #fff;
  margin-top: 20rpx;
  letter-spacing: 0.8rpx;
}

.board-box-image {
  width: 50rpx;
  height: 50rpx;
  transition: transform 0.2s ease;
}

.input-box-board-item:active .board-box-image {
  transform: scale(1.1);
}
</style>