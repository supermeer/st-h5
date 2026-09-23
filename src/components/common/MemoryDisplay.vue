<template>
  <div class="memory-display">
    <div class="memory-bar">
      <div class="memory-track">
        <div 
          class="memory-fill" 
          :style="{ width: fillPercent + '%' }"
        ></div>
      </div>
      <div class="memory-labels">
        <span class="label">智能</span>
        <span class="label">记忆</span>
      </div>
    </div>
    <div class="memory-info">
      <span class="current-value">{{ currentMemory }}</span>
      <span class="max-value">/ {{ maxMemory }}</span>
      <span class="unit">条对话</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentMemory: {
    type: Number,
    default: 0
  },
  memoryOptions: {
    type: Array,
    default: () => []
  }
})

const maxMemory = computed(() => {
  if (props.memoryOptions.length > 0) {
    return props.memoryOptions[props.memoryOptions.length - 1]?.value || 30
  }
  return 30
})

const fillPercent = computed(() => {
  if (maxMemory.value === 0) return 0
  return Math.min((props.currentMemory / maxMemory.value) * 100, 100)
})
</script>

<style lang="scss" scoped>
.memory-display {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
}

.memory-bar {
  margin-bottom: 16rpx;
}

.memory-track {
  height: 16rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8rpx;
  overflow: hidden;
}

.memory-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF5F15, #FF9500);
  border-radius: 8rpx;
  transition: width 0.3s ease;
}

.memory-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
}

.label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
}

.memory-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.current-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #FF5F15;
}

.max-value {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.unit {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 8rpx;
}
</style>
