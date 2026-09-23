<template>
  <van-popup
    v-model:show="visible"
    round
    :close-on-click-overlay="true"
    class="model-err-dialog"
    @click-overlay="handleCancel"
  >
    <div class="dialog-content">
      <!-- 图标 -->
      <div class="dialog-icon">🤖</div>

      <!-- 内容 -->
      <div class="dialog-message">{{ content }}</div>

      <!-- 按钮 -->
      <div class="dialog-actions">
        <van-button 
          type="primary" 
          block 
          round
          class="confirm-btn"
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
const content = ref('')
const confirmText = ref('确认')

let _onConfirm = null

function show(options = {}) {
  const {
    content: c = '抱歉！我的大脑宕机了！\n请为我换个大脑吧~',
    confirmText: ct = '确认',
    onConfirm
  } = options

  _onConfirm = onConfirm
  content.value = c
  confirmText.value = ct

  visible.value = true
}

function hide() {
  visible.value = false
  _onConfirm = null
}

function handleConfirm() {
  if (typeof _onConfirm === 'function') {
    _onConfirm()
  }
  hide()
}

function handleCancel() {
  hide()
}

defineExpose({ show, hide })
</script>

<style lang="scss" scoped>
.model-err-dialog {
  width: 600rpx;
}

.dialog-content {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx;
  text-align: center;
}

.dialog-icon {
  font-size: 100rpx;
  margin-bottom: 32rpx;
}

.dialog-message {
  font-size: 30rpx;
  color: #333;
  line-height: 1.8;
  margin-bottom: 48rpx;
  white-space: pre-line;
}

.dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.confirm-btn {
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border: none;
}
</style>
