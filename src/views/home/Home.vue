<template>
  <div class="page home-page" :style="pageStyle">
    <div class="home-content">
      <!-- 已登录：渲染 Chat 组件（参照小程序原项目 home.js 中直接挂 <chat> 的逻辑） -->
      <Chat
        v-if="isLogin && roleForm.id"
        ref="chatRef"
        :role-info="roleForm"
        :group-info="groupForm"
        :plot-info="plotInfo"
        :show-back="false"
        @hide-tabbar="hideTabbar"
        @show-tabbar="showTabbar"
        @current-bg-change="onCurrentBgChange"
      />

      <!-- 已登录但尚无角色：占位（等待 loadHomePlot 拉取中） -->
      <ChatPlaceholder
        v-else-if="isLogin"
        :role-info="roleForm"
        :group-info="groupForm"
        :plot-info="plotInfo"
        :show-back="false"
      />

      <!-- 未登录：onMounted 会自动跳转到登录页，此处仅作兜底渲染 -->
      <div v-else class="welcome">
        <van-button type="primary" round @click="goLogin">登录开启 AI 对话</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Chat from '@/components/chat/Chat.vue'
import ChatPlaceholder from '@/components/ChatPlaceholder.vue'
import { useUserStore } from '@/store/user'
import { getHomePlotMessage } from '@/api/ai/chat'
import { getMinorReminderConfig, confirmAdultIdentity } from '@/api/usercenter'
import { navigateToLogin } from '@/utils/auth-bridge'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ===== 状态 =====
const isLogin = ref(false)
const plotInfo = ref({ id: null, type: '', isGroupChat: false })
const roleForm = ref({ id: null, type: '', plotId: null })
const groupForm = ref({ id: null, type: '' })
const currentBg = ref('')
const showBG = ref(true)

// refs
const chatRef = ref(null)

// ===== TabBar 控制 =====
// 维护本地 tabbarVisible，响应 Chat → InputBox 的 hideTabbar / showTabbar 事件。
// 隐藏 TabBar 时，聊天区可以占用整个视口（避免被 TabBar 遮挡），
// 同时通过 window 事件通知 CustomTabBar 组件隐藏自身。
const tabbarVisible = ref(true)
const TABBAR_HEIGHT_VAR = '--tabbar-height-safearea'

function hideTabbar() {
  tabbarVisible.value = false
  window.dispatchEvent(new CustomEvent('h5:hide-tabbar'))
}

function showTabbar() {
  tabbarVisible.value = true
  window.dispatchEvent(new CustomEvent('h5:show-tabbar'))
}

// ===== 计算属性 =====
const pageStyle = computed(() => ({
  // TabBar 显示时，给 Chat 留出底部 padding 让内容不被 TabBar 遮挡；
  // TabBar 隐藏时（InputBox 展开工具栏/灵感面板），让 Chat 占满整个视口。
  height: tabbarVisible.value
    ? `calc(100vh - var(${TABBAR_HEIGHT_VAR}))`
    : '100vh',
  backgroundColor: '#252525',
  backgroundImage: showBG.value && currentBg.value ? `url(${currentBg.value})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat'
}))

// ===== 生命周期 =====
onMounted(() => {
  // 读取 aE 开关（参照小程序 home.js onLoad 中的逻辑）
  const ev = localStorage.getItem('aE')
  if (ev === '0') {
    showBG.value = false
  }

  // 如果已登录，初始化
  if (userStore.isLogin) {
    onLoginSuccess()
  } else {
    // 未登录：直接跳转到登录页（登录成功后会回到首页）
    nextTick(() => {
      goLogin()
    })
  }

  // 监听全局登录成功事件
  window.addEventListener('h5:user-login-success', onLoginSuccess)

  // 监听子组件背景变更
  window.addEventListener('h5:current-bg-change', (e) => {
    currentBg.value = e.detail?.bg || ''
    showBG.value = !!currentBg.value
  })
})

onUnmounted(() => {
  window.removeEventListener('h5:user-login-success', onLoginSuccess)
  // 离开 Home 时确保 TabBar 恢复显示，避免影响其他 tabBar 页面
  if (!tabbarVisible.value) {
    tabbarVisible.value = true
    window.dispatchEvent(new CustomEvent('h5:show-tabbar'))
  }
})

// ===== 方法 =====
/**
 * 登录成功 / 已登录时的初始化
 * 对应小程序 home.js 中的 loginSuccess 和 onShow
 */
function onLoginSuccess() {
  isLogin.value = true
  loadHomePlot()
  checkMinorReminder()
}

/**
 * 拉取首页默认剧情
 * 对应小程序 home.js 中的 getHomePlotMessage
 */
function loadHomePlot() {
  getHomePlotMessage()
    .then((res) => {
      if (!res) return
      // 防止重复设置相同的 plotId（参照小程序：if (res.plotId && this.data.roleForm.plotId === res.plotId) return）
      if (res.plotId && roleForm.value.plotId === res.plotId) {
        return
      }

      // 注意：原小程序是直接 setData 把整个 roleForm 替换掉
      roleForm.value = {
        type: res.type || '',
        id: res.characterId || null,
        plotId: res.plotId || null
      }

      groupForm.value = {
        id: res.groupChatId || null,
        type: res.type || ''
      }

      plotInfo.value = {
        id: res.plotId || null,
        type: res.type || '',
        isGroupChat: !!res.groupChatId
      }
    })
    .catch((e) => {
      console.error('loadHomePlot error', e)
    })
}

/**
 * 首次登录后检查未成年人提醒
 */
function checkMinorReminder() {
  if (localStorage.getItem('minorConfirmed')) return
  getMinorReminderConfig()
    .then((res) => {
      if (res && res.showMinorReminder) {
        if (window.confirm('您是否已年满 18 岁？')) {
          confirmAdultIdentity({ confirmed: true, confirmTime: Date.now() })
            .then(() => localStorage.setItem('minorConfirmed', 'true'))
            .catch((e) => console.error('confirmAdultIdentity failed', e))
        }
      }
    })
    .catch((e) => console.error('checkMinorReminder error', e))
}

/**
 * 未登录时跳转到 web 登录页
 * 通过统一鉴权桥接工具跳转，登录成功后回到当前页面
 */
function goLogin() {
  navigateToLogin({ redirect: route.fullPath })
}

/**
 * 剧情切换（由 Chat 组件通过 changePlot 事件触发，参照小程序 changePlot）
 */
function changePlot({ plotId, type, characterId }) {
  roleForm.value = {
    ...roleForm.value,
    plotId,
    type,
    id: characterId
  }
}

// ===== 背景变化 =====
function onCurrentBgChange({ bg }) {
  currentBg.value = bg || ''
  showBG.value = !!currentBg.value
}
</script>

<style lang="scss" scoped>
.home-page {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.home-content {
  width: 100%;
  height: 100%;
}
.welcome {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
</style>
