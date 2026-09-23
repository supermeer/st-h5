<template>
  <div id="app-root">
    <!-- 全局 Auth 弹窗 -->
    <AuthDialog v-model="authVisible" @login-success="onLoginSuccess" />
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
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AuthDialog from '@/components/AuthDialog.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import { useUserStore } from '@/store/user'

const route = useRoute()
const userStore = useUserStore()
const authVisible = ref(false)

// 监听需要登录的事件
window.addEventListener('h5:show-login-modal', () => {
  authVisible.value = true
})

// 401 时自动弹出
window.addEventListener('h5:auth-required', () => {
  authVisible.value = true
})

function onLoginSuccess() {
  authVisible.value = false
}
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
