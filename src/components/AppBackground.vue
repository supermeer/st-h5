<!--
  全局背景层（剧情背景图）
  - 由 App.vue 在 #app-root 内挂一份
  - position: fixed 铺满视口
  - 高度由 JS 锁定到"视觉稳定高度"，避免底栏收起 / 地址栏展开导致 background-size: cover 反复重算而出现图片抖动
  - background-image 来自 useBackgroundStore
  - z-index: 0；聊天内容需自行 position: relative + z-index >= 1 才能盖在背景上
-->
<template>
  <Transition name="app-bg-fade">
    <div
      v-if="shouldShow"
      class="app-bg"
      :style="{
        backgroundImage: `url(${currentBg})`,
        height: stableHeight + 'px'
      }"
      aria-hidden="true"
    ></div>
  </Transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useBackgroundStore } from '@/store/background'

const bgStore = useBackgroundStore()
const { currentBg, enabled } = storeToRefs(bgStore)

const shouldShow = computed(() => enabled.value && !!currentBg.value)

// ===== 关键：锁定背景容器的高度 =====
// 取「视口真实高度」作为基准，只增不减，避免地址栏收起 / 底栏弹起等
// 引起的视口高度变化后，cover 算法重新缩放背景图而出现视觉抖动。
const stableHeight = ref(0)

const getVisualHeight = () => {
  // visualViewport 在 iOS Safari 上能拿到真实可视区域，受地址栏影响更小
  if (window.visualViewport) {
    return Math.round(window.visualViewport.height)
  }
  return Math.round(window.innerHeight)
}

let rafId = null
const updateStableHeight = () => {
  // rAF 防抖，避免 resize 风暴频繁触发重排
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    const h = getVisualHeight()
    // 只增不减：一旦确定了一个较大基准，后续不再缩小
    // （防止地址栏收回 / 底栏收起时图反而变小）
    if (h > stableHeight.value) {
      stableHeight.value = h
    }
  })
}

onMounted(() => {
  stableHeight.value = getVisualHeight()
  window.addEventListener('resize', updateStableHeight, { passive: true })
  window.addEventListener('orientationchange', updateStableHeight)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateStableHeight)
  }
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', updateStableHeight)
  window.removeEventListener('orientationchange', updateStableHeight)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateStableHeight)
  }
})
</script>

<style lang="scss" scoped>
.app-bg {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  // 高度由 :style 控制（JS 锁定），不再用 inset: 0 / height: 100vh
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  // 层级要足够低，但又要比 #app-root 的 background-color 高，
  // 否则背景色会把背景图盖住。
  z-index: 0;
  pointer-events: none;
}

// 图片切换时的淡入淡出
.app-bg-fade-enter-active,
.app-bg-fade-leave-active {
  transition: opacity 0.25s ease;
}
.app-bg-fade-enter-from,
.app-bg-fade-leave-to {
  opacity: 0;
}
</style>