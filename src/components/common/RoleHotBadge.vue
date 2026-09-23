<template>
  <div class="role-hot-badge">
    <span v-if="roleHot" class="hot-item">
      <span class="hot-icon">🔥</span>
      <span class="hot-value">{{ formatCount(roleHot) }}</span>
    </span>
    <span v-if="chatCount" class="chat-item">
      <span class="chat-icon">💬</span>
      <span class="chat-value">{{ formatCount(chatCount) }}</span>
    </span>
  </div>
</template>

<script setup>
defineProps({
  roleHot: {
    type: [Number, String],
    default: 0
  },
  chatCount: {
    type: [Number, String],
    default: 0
  }
})

function formatCount(num) {
  const n = Number(num) || 0
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + 'w'
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'k'
  }
  return n.toString()
}
</script>

<style lang="scss" scoped>
.role-hot-badge {
  display: flex;
  gap: 24rpx;
}

.hot-item,
.chat-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.hot-icon,
.chat-icon {
  font-size: 24rpx;
}
</style>
