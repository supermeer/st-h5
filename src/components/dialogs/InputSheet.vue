<template>
  <van-popup
    v-model:show="visible"
    round
    position="bottom"
    :close-on-click-overlay="true"
    class="input-sheet"
    @click-overlay="handleMaskClick"
  >
    <div class="sheet-content">
      <div class="sheet-header">
        <span class="cancel-btn" @click="handleCancel">{{ cancelText }}</span>
        <span class="sheet-title">{{ title }}</span>
        <span class="confirm-btn" @click="handleConfirm">{{ confirmText }}</span>
      </div>
      
      <div class="sheet-body">
        <div class="input-label">{{ label }}</div>
        <van-field
          v-model="inputValue"
          :type="inputType === 'textarea' ? 'textarea' : 'text'"
          :placeholder="placeholder"
          :maxlength="maxlength"
          autosize
          :show-word-limit="true"
          @input="handleInput"
        />
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const title = ref('创建新剧情')
const label = ref('剧情名称')
const placeholder = ref('请输入')
const cancelText = ref('取消')
const confirmText = ref('保存')
const inputValue = ref('')
const maxlength = ref(50)
const inputType = ref('input')

let _onCancel = null
let _onConfirm = null

function show(options = {}) {
  const {
    title: t = '创建新剧情',
    label: l = '剧情名称',
    placeholder: p = '请输入',
    cancelText: ct = '取消',
    confirmText: cf = '保存',
    value = '',
    maxlength: ml = 50,
    inputType: it = 'input',
    onCancel,
    onConfirm
  } = options

  _onCancel = onCancel
  _onConfirm = onConfirm

  title.value = t
  label.value = l
  placeholder.value = p
  cancelText.value = ct
  confirmText.value = cf
  inputValue.value = value
  maxlength.value = ml
  inputType.value = it

  visible.value = true
}

function hide() {
  visible.value = false
  inputValue.value = ''
  _onCancel = null
  _onConfirm = null
}

function handleInput(e) {
  inputValue.value = e.detail?.value ?? e
}

function handleCancel() {
  if (typeof _onCancel === 'function') {
    _onCancel()
  }
  hide()
}

function handleConfirm() {
  if (typeof _onConfirm === 'function') {
    _onConfirm(inputValue.value)
  }
  hide()
}

function handleMaskClick() {
  handleCancel()
}

defineExpose({ show, hide })
</script>

<style lang="scss" scoped>
.input-sheet {
  background: #fff;
}

.sheet-content {
  padding-bottom: env(safe-area-inset-bottom);
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1px solid #f0f0f0;
}

.sheet-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.cancel-btn,
.confirm-btn {
  font-size: 28rpx;
  padding: 8rpx 16rpx;
}

.cancel-btn {
  color: #999;
}

.confirm-btn {
  color: #FF5F15;
  font-weight: 500;
}

.sheet-body {
  padding: 32rpx;
}

.input-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
}
</style>
