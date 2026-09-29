<template>
  <!-- 占位：让 fixed 吸顶的 nav 不遮挡下方内容 -->
  <div class="custom-nav-spacer" aria-hidden="true" />
  <div class="custom-nav" :style="navStyle" :class="{ 'custom-nav--transparent': transparent }">
    <!-- 内容区（自带顶部 safearea padding，避免被状态栏/刘海遮挡） -->
    <div class="nav-content">
      <div
        class="nav-left"
        :style="{ width: leftSlotWidth + 'px', paddingLeft: leftPadding + 'px' }"
      >
        <template v-if="customLeft">
          <slot name="left" />
        </template>
        <template v-else>
          <div v-if="showLeftLogo" class="left-logo" @click="onHome">
            <img :src="logoIcon" alt="" />
          </div>
          <div v-else-if="showBack" class="back-btn" @click="onBack">
            <van-icon name="arrow-left" :color="titleColor" size="22px" />
          </div>
        </template>
      </div>
      <div v-if="$slots.center" class="nav-center">
        <slot name="center" />
      </div>
      <div v-else class="nav-title" :style="{ color: titleColor, fontWeight: bold ? 'bold' : '500' }">
        {{ title }}
      </div>
      <div class="nav-right">
        <slot name="right" />
        <!-- 胶囊占位：仅在显示时渲染，避免占位空间浪费 -->
        <div
          v-if="showCapsule"
          class="nav-capsule-placeholder"
          :style="{ width: capsuleWidth + 'px' }"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  showHome: { type: Boolean, default: false },
  showLeftLogo: { type: Boolean, default: false },
  showCapsule: { type: Boolean, default: true },
  transparent: { type: Boolean, default: false },
  bgColor: { type: String, default: '' },
  titleColor: { type: String, default: '#fff' },
  navColor: { type: String, default: '#252525' },
  customLeft: { type: Boolean, default: false },
  bold: { type: Boolean, default: true },
  logoIcon: { type: String, default: '/static/icons/logo.png' },
  leftSlotWidth: { type: Number, default: 87 },
  leftPadding: { type: Number, default: 20 },
  capsuleWidth: { type: Number, default: 87 }
})

const emit = defineEmits(['back', 'home'])

const router = useRouter()

const navStyle = computed(() => ({
  background: props.bgColor || (props.transparent ? 'transparent' : props.navColor),
  color: props.titleColor
}))

function onBack() {
  emit('back')
  if (window.history.length > 1) router.back()
  else router.push('/pages/home/home')
}

function onHome() {
  emit('home')
  router.push('/pages/home/home')
}
</script>

<style lang="scss" scoped>
.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-sizing: border-box;
  flex-shrink: 0;
  flex-grow: 0;
  /* 整体高度由 padding-top (safearea) + 内容 (44px) 决定，浏览器自动响应 resize/orientationchange */
  padding-top: var(--safearea-top);
}

.custom-nav-spacer {
  width: 100%;
  /* 占位高度 = safearea-top + 内容 44px，与 .custom-nav 实际占位保持一致 */
  height: var(--nav-height-safearea);
  flex-shrink: 0;
  flex-grow: 0;
}

.custom-nav--transparent {
  background: transparent !important;
}

.nav-content {
  display: flex;
  align-items: center;
  position: relative;
  height: var(--nav-height);
  padding: 0;
}

.nav-capsule-placeholder {
  /* 胶囊占位：相对于 nav-content 定位，自动跟随顶部安全区
     （不需要再算 env()，已经被父元素的 padding-top 推到正确位置）*/
  height: 32px;
  pointer-events: none;
  z-index: 0;
  margin-left: auto;
}

.nav-left {
  display: flex;
  align-items: center;
  height: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
}

.back-btn {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 8px;
}

.left-logo {
  display: flex;
  align-items: center;
  height: 100%;
  cursor: pointer;
}

.left-logo img {
  width: 152px;
  height: 36px;
  object-fit: contain;
}

.nav-center {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  max-width: 50%;
  pointer-events: auto;
}

.nav-title {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  font-size: 17px;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-right {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 92px; /* 给胶囊位置让位 */
  min-width: 0;
}
</style>
