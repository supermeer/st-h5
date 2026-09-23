<template>
  <div class="page chatlist-page">
    <CustomNav transparent :show-back="false" :show-home="false" :show-left-logo="false" />
    <div class="content">
      <van-empty description="暂无聊天记录" />
    </div>
  </div>
</template>

<script setup>
import CustomNav from '@/components/CustomNav.vue'
</script>

<style lang="scss" scoped>
.chatlist-page {
  min-height: 100vh;
  background-color: var(--theme-color-black);
  color: #fff;
  padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px));
}
.chatlist-page :deep(.van-empty) {
  padding-top: 60vw;
}
.chatlist-page :deep(.van-empty__description) {
  color: var(--desc-color);
}
.content {
  padding: 16px;
}
</style>
