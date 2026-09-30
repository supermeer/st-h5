<template>
  <div class="chat-page">
    <!-- 聊天内容 -->
    <div class="chat-content">
      <Chat
        v-if="isLogin"
        ref="chatRef"
        :role-info="roleForm"
        :group-info="groupForm"
        :plot-info="plotInfo"
        :show-back="true"
        :is-share="shareForm.isShare"
        @hide-tabbar="hideTabbar"
        @show-tabbar="showTabbar"
      />

      <!-- 未登录状态 -->
      <div v-else class="login-tip">
        <div class="tip-content">
          <div class="tip-icon">🔒</div>
          <div class="tip-text">登录后即可体验 AI 对话</div>
          <van-button type="primary" round @click="goLogin">去登录</van-button>
        </div>
      </div>
    </div>

    <!-- 登录组件 -->
    <AuthDialog
      ref="authRef"
      :check-phone="false"
      @login-success="onLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Chat from '@/components/chat/Chat.vue'
import AuthDialog from '@/components/AuthDialog.vue'
import { useUserStore } from '@/store/user'
import { useBackgroundStore } from '@/store/background'
import { getCurrentPlotByCharacterId, getCharacterDetail, shareCharacter, enterFromDiscover } from '@/api/role'
import { getCurrentPlotByGroupChatId, getGroupDetail } from '@/api/group'
import { createPlot } from '@/api/ai/chat'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const backgroundStore = useBackgroundStore()

// 状态
const isLogin = ref(false)
const chatRef = ref(null)
const authRef = ref(null)

const plotInfo = ref({
  id: null,
  type: '',
  isGroupChat: false
})

const roleForm = ref({
  id: null,
  type: ''
})

const groupForm = ref({
  id: null,
  type: ''
})

const shareForm = ref({
  id: null,
  type: '',
  plotId: null,
  isShare: false
})

// 页面加载
onMounted(() => {
  const { plotId, characterId, isShare, id, isDiscover = false, groupId } = route.query

  // 检查背景显示设置（aE === '0' 关闭剧情背景）
  const ev = localStorage.getItem('aE')
  if (ev === '0') {
    backgroundStore.setEnabled(false)
  }

  // 设置剧情信息
  plotInfo.value = {
    ...plotInfo.value,
    isGroupChat: !!groupId,
    id: plotId || null
  }

  if (!isShare) {
    roleForm.value = {
      type: '',
      id: characterId || null
    }
    groupForm.value = {
      id: groupId || null,
      type: 'group'
    }
    shareForm.value.isShare = false

    // 获取当前剧情
    if (userStore.isLogin) {
      isLogin.value = true
      if (groupId) {
        getGroupPlot(groupId)
      } else if (characterId) {
        getCharacterPlot(characterId)
      }
    }
  } else {
    shareForm.value = {
      type: '',
      id: characterId || null,
      plotId: plotId || null,
      isShare: true
    }

    // 需要登录
    if (!userStore.isLogin) {
      // 延迟弹出登录框
      setTimeout(() => {
        authRef.value?.show()
      }, 500)
    } else {
      isLogin.value = true
      if (groupId) {
        getGroupPlot(groupId)
      } else {
        getCharacterPlot(shareForm.value.id)
      }
    }
  }
})

// 路由级背景管理已由 App.vue 中的 router.beforeEach 统一处理
// 进入 chat 路由不清空（旧背景延续到 Chat.vue 加载完剧情并 setBg()），
// 进入其它路由清空。

// 获取角色剧情
async function getCharacterPlot(characterId) {
  try {
    const res = await getCurrentPlotByCharacterId(characterId)
    plotInfo.value.id = res?.plotId || null

    // 如果没有剧情但有角色ID，获取角色详情
    if (!plotInfo.value.id && characterId) {
      const detail = await getCharacterDetail(characterId)
      if (detail?.defaultStoryId) {
        // 创建新剧情
        const newPlotId = await createPlot({
          characterId,
          storyId: detail.defaultStoryId
        })
        plotInfo.value.id = newPlotId
      }
    }
  } catch (e) {
    console.error('获取角色剧情失败', e)
  }
}

// 获取群聊剧情
async function getGroupPlot(groupId) {
  try {
    const res = await getCurrentPlotByGroupChatId(groupId)
    plotInfo.value.id = res?.plotId || null

    // 如果没有剧情，创建新剧情
    if (!plotInfo.value.id && groupId) {
      const newPlotId = await createPlot({
        groupChatId: groupId
      })
      plotInfo.value.id = newPlotId
    }
  } catch (e) {
    console.error('获取群聊剧情失败', e)
  }
}

// 登录成功
async function onLoginSuccess() {
  isLogin.value = true

  if (plotInfo.value.isGroupChat) {
    await getGroupPlot(groupForm.value.id)
  } else {
    const id = shareForm.value.isShare ? shareForm.value.id : roleForm.value.id
    await getCharacterPlot(id)
  }
}

// 隐藏 TabBar
function hideTabbar() {
  // H5 环境无需处理
}

// 显示 TabBar
function showTabbar() {
  // H5 环境无需处理
}

// 去登录
function goLogin() {
  authRef.value?.show()
}
</script>

<style lang="scss" scoped>
.chat-page {
  // 背景图由 App.vue 的 <AppBackground /> 全局渲染（position: fixed），
  // 这里不再写 backgroundImage / page-bg。
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.login-tip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tip-content {
  text-align: center;
  padding: 48px;
}

.tip-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.tip-text {
  font-size: 28px;
  color: #666;
  margin-bottom: 32px;
}
</style>
