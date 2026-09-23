<template>
  <div class="chat-placeholder">
    <div class="chat-loading">
      <van-loading type="spinner" color="#FF5F15">加载中...</van-loading>
    </div>
    <div class="chat-tip">
      <text class="ai-tip">星语酒馆 - AI 对话聊天</text>
    </div>
  </div>
</template>

<script setup>
defineProps({
  roleInfo: { type: Object, default: () => ({}) },
  groupInfo: { type: Object, default: () => ({}) },
  plotInfo: { type: Object, default: () => ({}) },
  showBack: { type: Boolean, default: false },
  isShare: { type: Boolean, default: false }
})
</script>

<style lang="scss" scoped>
.chat-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: var(--theme-color-black);
  color: #fff;
}
.chat-loading {
  margin-bottom: 24px;
}
.chat-tip {
  font-size: 28rpx;
  color: #aaa;
}
</style>
