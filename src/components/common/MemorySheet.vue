<template>
  <van-popup
    v-model:show="visible"
    round
    position="bottom"
    :close-on-click-overlay="true"
    class="memory-sheet"
  >
    <div class="sheet-content">
      <div class="sheet-header">
        <span class="cancel-btn" @click="handleCancel">取消</span>
        <span class="sheet-title">智能体记忆力</span>
        <span class="confirm-btn" @click="handleConfirm">确认</span>
      </div>

      <div class="sheet-body">
        <div class="memory-desc">
          记忆力越强，智能体对你的记忆越持久，但响应可能会变慢。
        </div>

        <div class="memory-slider-wrap">
          <van-slider
            v-model="currentCount"
            :min="0"
            :max="maxCount"
            :step="1"
            active-color="#FF5F15"
            inactive-color="#333"
            bar-height="12rpx"
            @change="onSliderChange"
          />
        </div>

        <div class="memory-options">
          <div 
            v-for="option in memoryOptions" 
            :key="option.value"
            class="option-item"
            :class="{ active: currentCount === option.value }"
            @click="selectOption(option.value)"
          >
            <div class="option-value">{{ option.value }}</div>
            <div class="option-label">{{ option.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const visible = ref(false)
const currentCount = ref(0)
const plotId = ref(null)
const memoryOptions = ref([])

let _onConfirm = null

const maxCount = computed(() => {
  if (memoryOptions.value.length > 0) {
    return memoryOptions.value[memoryOptions.value.length - 1]?.value || 30
  }
  return 30
})

watch(currentCount, (val) => {
  // 同步更新到最近匹配的选项
})

function show(options = {}) {
  const {
    currentCount: count = 0,
    plotId: pid = null,
    memoryOptions: opts = [],
    onConfirm
  } = options

  _onConfirm = onConfirm
  plotId.value = pid
  currentCount.value = count
  memoryOptions.value = opts

  visible.value = true
}

function hide() {
  visible.value = false
  _onConfirm = null
}

function handleCancel() {
  hide()
}

function onSliderChange(value) {
  currentCount.value = value
}

function selectOption(value) {
  currentCount.value = value
}

function handleConfirm() {
  if (typeof _onConfirm === 'function') {
    _onConfirm(currentCount.value)
  }
  hide()
}

defineExpose({ show, hide })
</script>

<style lang="scss" scoped>
.memory-sheet {
  max-height: 70vh;
}

.sheet-content {
  padding-bottom: env(safe-area-inset-bottom);
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1px solid #333;
}

.sheet-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
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

.memory-desc {
  font-size: 26rpx;
  color: #999;
  line-height: 1.6;
  margin-bottom: 32rpx;
  text-align: center;
}

.memory-slider-wrap {
  margin-bottom: 40rpx;
}

.memory-options {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  justify-content: center;
}

.option-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 32rpx;
  background: #333;
  border-radius: 16rpx;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &.active {
    background: rgba(255, 95, 21, 0.2);
    border-color: #FF5F15;
  }

  &:active {
    transform: scale(0.98);
  }
}

.option-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.option-label {
  font-size: 22rpx;
  color: #999;
}

.active .option-value {
  color: #FF5F15;
}
</style>
