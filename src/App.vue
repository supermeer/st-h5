<template>
  <div id="app-root">
    <!-- 全局背景层（剧情背景图）：position: fixed 铺满视口，不受内容高度影响 -->
    <AppBackground />

    <!-- 页面内容：在背景之上 -->
    <div class="app-stack">
      <router-view v-slot="{ Component, route }">
        <transition :name="route.meta?.transition || 'page-fade'" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- 自定义 TabBar（仅 TabBar 页面显示） -->
    <CustomTabBar v-if="route.meta?.tabBar" :active="route.meta?.index || 0" />
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useBackgroundStore } from '@/store/background'
import AppBackground from '@/components/AppBackground.vue'

const route = useRoute()
const router = useRouter()
const backgroundStore = useBackgroundStore()

// ============ 路由级背景管理 ============
// 由 router.beforeEach 统一决定是否清空 <AppBackground /> 的剧情背景：
//   - 进入 chat 路由（meta.bgScope === 'chat'）：不清空，让旧背景延续到 Chat.vue 加载完剧情并 setBg()
//     （避免 Chat -> Chat / Home -> Chat 等场景下背景闪白）
//   - 进入其它路由：清空，避免 Discover / UserCenter 等非聊天页出现残留剧情背景
//
// 不在页面 onUnmounted 里清空：那样会在 Chat -> Chat 切换时被误清，且与新页面 setBg 之间有窗口期。
router.beforeEach((to, from, next) => {
  const isChatRoute = to.meta?.bgScope === 'chat'
  if (!isChatRoute) {
    backgroundStore.clearBg()
  }
  next()
})

// h5:show-login-modal / h5:auth-required 的统一跳转逻辑已移至
// src/utils/auth-bridge.js（在 main.js 启动时通过 setupAuthBridge 注册）
// AuthDialog 组件保留在 src/components/AuthDialog.vue，由各页面按需引入，
// 不再在 App.vue 中全局挂载。
</script>

<style lang="scss">
@use '@/styles/tokens.scss';
@use '@/styles/global.scss';

#app-root {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-page);
  color: var(--text-title);
}

// 让 router-view 内容盖在 AppBackground 之上
.app-stack {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  // 让 app-stack 至少撑满视口高度，flex 子项（页面内容）才有基准高度
  min-height: 100vh;
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