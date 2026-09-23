<template>
  <van-popup
    v-model:show="visible"
    round
    :close-on-click-overlay="true"
    class="tip-dialog"
    @click-overlay="handleMaskClick"
  >
    <div class="tip-content">
      <!-- 可选图标 -->
      <div v-if="!hideTopIcon" class="tip-icon">💡</div>
      
      <!-- 标题 -->
      <div v-if="title" class="tip-title">{{ title }}</div>
      
      <!-- 内容 -->
      <div 
        class="tip-message" 
        :class="{ 'text-center': contentAlign === 'center' }"
      >
        {{ content }}
      </div>

      <!-- 按钮 -->
      <div class="tip-buttons">
        <van-button 
          v-if="cancelText" 
          size="small" 
          class="tip-btn cancel-btn"
          @click="handleCancel"
        >
          {{ cancelText }}
        </van-button>
        <van-button 
          type="primary" 
          size="small" 
          class="tip-btn confirm-btn"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const title = ref(null)
const hideTopIcon = ref(false)
const contentAlign = ref('')
const content = ref('回溯后，该条消息之后的对话将被清除，且不可撤回。')
const cancelText = ref('取消')
const confirmText = ref('确认')

let _onCancel = null
let _onConfirm = null

function show(options = {}) {
  const {
    title: t = null,
    hideTopIcon: hti = false,
    contentAlign: ca = '',
    content: c = '回溯后，该条消息之后的对话将被清除，且不可撤回。',
    cancelText: ct = '取消',
    confirmText: cf = '确认',
    onCancel,
    onConfirm
  } = options

  _onCancel = onCancel
  _onConfirm = onConfirm

  title.value = t
  hideTopIcon.value = hti
  contentAlign.value = ca
  content.value = c
  cancelText.value = ct
  confirmText.value = cf

  visible.value = true
}

function hide() {
  visible.value = false
  _onCancel = null
  _onConfirm = null
}

function handleCancel() {
  if (typeof _onCancel === 'function') {
    _onCancel()
  }
  hide()
}

function handleConfirm() {
  if (typeof _onConfirm === 'function') {
    _onConfirm()
  }
  hide()
}

function handleMaskClick() {
  hide()
}

defineExpose({ show, hide })
</script>

<style lang="scss" scoped>
.tip-dialog {
  width: 600rpx;
  background: transparent;
}

.tip-content {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx;
  text-align: center;
}

.tip-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.tip-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.tip-message {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 40rpx;
  text-align: left;

  &.text-center {
    text-align: center;
  }
}

.tip-buttons {
  display: flex;
  gap: 24rpx;
  justify-content: center;
}

.tip-btn {
  min-width: 200rpx;
  border-radius: 40rpx;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: none;
}

.confirm-btn {
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border: none;
}
</style>
