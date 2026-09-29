<template>
  <div id="app-root">
    <!-- 页面内容 -->
    <router-view v-slot="{ Component, route }">
      <transition :name="route.meta?.transition || 'page-fade'" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <!-- 自定义 TabBar（仅 TabBar 页面显示） -->
    <CustomTabBar v-if="route.meta?.tabBar" :active="route.meta?.index || 0" />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// h5:show-login-modal / h5:auth-required 的统一跳转逻辑已移至
// src/utils/auth-bridge.js（在 main.js 启动时通过 setupAuthBridge 注册）
// AuthDialog 组件保留在 src/components/AuthDialog.vue，由各页面按需引入，
// 不再在 App.vue 中全局挂载。
</script>

<style lang="scss">
@use '@/styles/tokens.scss';
@use '@/styles/global.scss';

#app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-page);
  color: var(--text-title);
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
