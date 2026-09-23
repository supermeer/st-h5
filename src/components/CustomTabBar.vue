<template>
  <div v-show="visible" class="custom-tab-bar">
    <div class="tab-bar-container" :style="{ paddingBottom: safeBottom + 'px' }">
      <div
        v-for="(item, index) in list"
        :key="item.text || item.type"
        class="tab-item"
        :class="['tab-' + index, { active: active === index, 'tab-add': item.isAdd }]"
        @click="onChange(index)"
      >
        <img
          v-if="!item.isAdd && item.img"
          class="tab-icon-img"
          :src="active === index && item.activeImg ? item.activeImg : item.img"
          alt=""
        />
        <van-icon
          v-else-if="item.isAdd"
          name="plus"
          class="tab-add-icon"
          size="28"
          color="#fff"
        />
        <div v-if="item.text" class="tab-text" :style="{ color: active === index ? activeColor : inactiveColor }">
          {{ item.text }}
        </div>
      </div>
    </div>

    <!-- 中间 + 按钮弹出的选择弹窗 -->
    <CreateSelectDialog
      v-model:visible="showCreateDialog"
      @select="onCreateSelect"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CreateSelectDialog from '@/components/dialogs/CreateSelectDialog.vue'

const props = defineProps({
  active: { type: Number, default: 0 },
  visible: { type: Boolean, default: true }
})

const router = useRouter()
const route = useRoute()

const list = [
  {
    text: '缘分',
    img: '/static/tabbar/yf.svg',
    activeImg: '/static/tabbar/yf-active.svg',
    url: '/pages/home/home'
  },
  {
    text: '发现',
    img: '/static/tabbar/fx.svg',
    activeImg: '/static/tabbar/fx-active.svg',
    url: '/pages/discover/index'
  },
  {
    type: 'add',
    isAdd: true,
    text: '',
    url: ''
  },
  {
    text: '聊天',
    img: '/static/tabbar/xx.svg',
    activeImg: '/static/tabbar/xx-active.svg',
    url: '/pages/chat-list/index'
  },
  {
    text: '我的',
    img: '/static/tabbar/wd.svg',
    activeImg: '/static/tabbar/wd-active.svg',
    url: '/pages/usercenter/index'
  }
]

const activeColor = '#fff'
const inactiveColor = '#aaa'
const safeBottom = computed(() => {
  if (typeof window === 'undefined') return 0
  const sa = window.document.documentElement.style.getPropertyValue('--sat')
  if (sa) return parseInt(sa, 10) || 0
  return 0
})

// 当前路由命中的 tab
const computedActive = computed(() => {
  const idx = list.findIndex((it) => it.url && route.path === it.url)
  return idx >= 0 ? idx : props.active
})
const active = computed(() => computedActive.value)

const showCreateDialog = ref(false)

function onChange(index) {
  const item = list[index]
  if (!item) return

  // 中间 + 按钮
  if (item.isAdd) {
    showCreateDialog.value = true
    return
  }

  if (route.path === item.url) return
  router.push(item.url)
}

function onCreateSelect(option) {
  if (!option) return
  if (option.url) {
    router.push(option.url)
  }
}

watch(
  () => props.active,
  () => {}
)
</script>

<style lang="scss" scoped>
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding-bottom: var(--safearea-bottom);
}

.tab-bar-container {
  width: 100%;
  height: var(--tabbar-height);
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-sizing: border-box;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  position: relative;
  z-index: 2;
  cursor: pointer;
}

.tab-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  margin-bottom: 4px;
}

.tab-text {
  font-size: 16px;
  letter-spacing: 0.5px;
  font-weight: 700;
  line-height: 1.2;
}

.tab-item.active .tab-text {
  font-weight: 700;
}

.tab-add {
  position: relative;
}

.tab-add-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c5ce7, #174DFF);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -16px;
  box-shadow: 0 4px 16px rgba(108, 92, 231, 0.4);
}

.tab-add .tab-add-icon {
  margin-bottom: 0;
}
</style>
