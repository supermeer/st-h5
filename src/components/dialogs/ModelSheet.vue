<template>
  <van-popup
    v-model:show="visible"
    round
    position="bottom"
    :close-on-click-overlay="true"
    class="model-sheet"
    @click-overlay="handleCancel"
  >
    <div class="sheet-content">
      <!-- 头部 -->
      <div class="sheet-header">
        <span class="cancel-btn" @click="handleCancel">{{ cancelText }}</span>
        <span class="sheet-title">{{ title }}</span>
        <span class="placeholder"></span>
      </div>

      <!-- 副标题 -->
      <div v-if="subtitle" class="sheet-subtitle">{{ subtitle }}</div>

      <!-- 模型列表 -->
      <div class="model-list">
        <div
          v-for="(option, index) in modelOptions"
          :key="option.id"
          class="model-item"
          :class="{ 
            selected: selectedOption?.id === option.id,
            disabled: option.disabled 
          }"
          @click="handleSelectOption(option, index)"
        >
          <div class="model-info">
            <div class="model-name">{{ option.name }}</div>
            <div v-if="option.description" class="model-desc">{{ option.description }}</div>
          </div>
          
          <div class="model-badges">
            <span 
              v-for="i in option.speedLevel" 
              :key="'speed-' + i" 
              class="badge speed-badge"
            >速度</span>
            <span 
              v-for="i in option.qualityLevel" 
              :key="'quality-' + i" 
              class="badge quality-badge"
            >质量</span>
          </div>

          <div class="model-check">
            <van-icon v-if="selectedOption?.id === option.id" name="success" color="#FF5F15" />
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { setGlobalModel } from '@/api/usercenter'

const visible = ref(false)
const title = ref('模型切换')
const subtitle = ref('不同模型，智能体对话效果及积分消耗都会不同哦~')
const cancelText = ref('返回')
const confirmText = ref('确认')
const modelOptions = ref([])
const selectedOption = ref(null)
const currentValue = ref(null)
const loading = ref(false)

let _onCancel = null
let _onConfirm = null

function show(options = {}) {
  const {
    title: t = '模型切换',
    subtitle: s = '不同模型，智能体对话效果及积分消耗都会不同哦~',
    modelOptions: mo = [],
    currentValue: cv = null,
    cancelText: ct = '返回',
    confirmText: cf = '确认',
    onCancel,
    onConfirm
  } = options

  _onCancel = onCancel
  _onConfirm = onConfirm

  title.value = t
  subtitle.value = s
  currentValue.value = cv
  
  // 处理模型选项
  modelOptions.value = mo.map(opt => ({
    ...opt,
    speedLevel: Number(opt.speedLevel || 0),
    qualityLevel: Number(opt.qualityLevel || 0),
    disabled: opt.status != 1
  }))

  // 选择当前值或第一个可用
  const byCurrent = modelOptions.value.find(opt => opt.id === cv && !opt.disabled)
  const firstEnabled = modelOptions.value.find(opt => !opt.disabled)
  selectedOption.value = byCurrent || firstEnabled || null

  visible.value = true
}

function hide() {
  visible.value = false
  _onCancel = null
  _onConfirm = null
}

function handleSelectOption(option, index) {
  if (option.disabled) return
  selectedOption.value = option
}

async function handleConfirm() {
  if (!selectedOption.value) return

  loading.value = true
  try {
    await setGlobalModel({ modelId: selectedOption.value.id })
    
    if (typeof _onConfirm === 'function') {
      _onConfirm(selectedOption.value.id, selectedOption.value)
    }
    
    hide()
  } catch (e) {
    console.error('保存模型失败', e)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  if (typeof _onCancel === 'function') {
    _onCancel()
  }
  hide()
}

defineExpose({ show, hide })
</script>

<style lang="scss" scoped>
.model-sheet {
  max-height: 70vh;
}

.sheet-content {
  padding-bottom: var(--safearea-bottom);
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
.placeholder {
  font-size: 28rpx;
  color: #666;
  min-width: 100rpx;
}

.placeholder {
  // 占位
}

.sheet-subtitle {
  padding: 24rpx 32rpx;
  font-size: 26rpx;
  color: #999;
  background: #fafafa;
}

.model-list {
  max-height: 60vh;
  overflow-y: auto;
  padding: 24rpx 32rpx;
}

.model-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:last-child {
    margin-bottom: 0;
  }

  &.selected {
    background: #fff5f0;
    border-color: #FF5F15;
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.98);
  }
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.model-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.4;
}

.model-badges {
  display: flex;
  gap: 8rpx;
  margin-right: 24rpx;
}

.badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.speed-badge {
  background: #e3f2fd;
  color: #1976d2;
}

.quality-badge {
  background: #f3e5f5;
  color: #7b1fa2;
}

.model-check {
  width: 48rpx;
  text-align: center;
}
</style>
