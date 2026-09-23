<template>
  <div class="page home-page" :style="pageStyle">
    <div class="home-content" :style="contentStyle">
      <div v-if="!isLogin" class="welcome">
        <van-button type="primary" round @click="goLogin">登录开启 AI 对话</van-button>
      </div>
      <ChatPlaceholder
        v-else
        :role-info="roleForm"
        :group-info="groupForm"
        :plot-info="plotInfo"
        :show-back="false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import ChatPlaceholder from '@/components/ChatPlaceholder.vue'
import { useUserStore } from '@/store/user'
import { getHomePlotMessage } from '@/api/ai/chat'
import { getMinorReminderConfig, confirmAdultIdentity } from '@/api/usercenter'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(false)
const plotInfo = ref({ id: null, type: '', isGroupChat: false })
const roleForm = ref({ id: null, type: '', plotId: null })
const groupForm = ref({ id: null, type: '' })
const currentBg = ref('')
const showBG = ref(false)

const pageStyle = computed(() => ({
  height: '100vh',
  backgroundColor: '#252525',
  backgroundImage: showBG.value && currentBg.value ? `url(${currentBg.value})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat'
}))
const contentStyle = { height: '100%', paddingBottom: '140px' }

onMounted(() => {
  if (userStore.isLogin) {
    isLogin.value = true
    loadHomePlot()
  }
  // 监听登录成功
  window.addEventListener('h5:user-login-success', () => {
    isLogin.value = true
    loadHomePlot()
    checkMinorReminder()
  })
  // 监听子组件背景变更
  window.addEventListener('h5:current-bg-change', (e) => {
    currentBg.value = e.detail?.bg || ''
    showBG.value = !!currentBg.value
  })
})

function loadHomePlot() {
  getHomePlotMessage()
    .then((res) => {
      plotInfo.value = {
        id: res.plotId || null,
        type: res.type || '',
        isGroupChat: !!res.groupChatId
      }
      groupForm.value = { id: res.groupChatId || null, type: res.type || '' }
      roleForm.value = {
        id: res.characterId || null,
        type: res.type || '',
        plotId: res.plotId || null
      }
    })
    .catch((e) => console.error('loadHomePlot error', e))
}

function checkMinorReminder() {
  if (localStorage.getItem('minorConfirmed')) return
  getMinorReminderConfig()
    .then((res) => {
      if (res && res.showMinorReminder) {
        if (window.confirm('您是否已年满 18 岁？')) {
          confirmAdultIdentity({ confirmed: true, confirmTime: Date.now() })
            .then(() => localStorage.setItem('minorConfirmed', 'true'))
        }
      }
    })
    .catch((e) => console.error(e))
}

function goLogin() {
  window.dispatchEvent(new CustomEvent('h5:show-login-modal'))
}
</script>

<style lang="scss" scoped>
.home-page {
  height: 100vh;
  width: 100vw;
  background-color: var(--theme-color-black);
  padding-bottom: env(safe-area-inset-bottom, 0px);
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
