<template>
  <div class="group-chat-page">
    <!-- 群聊背景蒙版（半透明黑色），用于压暗全局剧情背景图，让消息文字更易读 -->
    <div class="page-bg-mask"></div>

    <!-- 群聊内容 -->
    <GroupChat
      v-if="isLogin"
      ref="chatRef"
      :group-info="groupForm"
      :plot-info="plotInfo"
      :show-back="true"
      @hide-tabbar="hideTabbar"
      @show-tabbar="showTabbar"
    />

    <!-- 登录弹窗 -->
    <AuthDialog
      ref="authRef"
      :check-phone="false"
      @login-success="onLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import GroupChat from '@/components/chat/GroupChat.vue'
import AuthDialog from '@/components/AuthDialog.vue'

const route = useRoute()
const userStore = useUserStore()

const chatRef = ref(null)
const authRef = ref(null)

const groupForm = ref({})
const plotInfo = ref({})

const isLogin = computed(() => userStore.isLogin)

onMounted(() => {
  const { groupId, plotId } = route.query

  // 初始化群聊信息
  if (groupId) {
    groupForm.value = {
      groupId
    }
  }

  if (plotId) {
    plotInfo.value = {
      id: plotId
    }
  }

  // 检查登录状态
  if (!isLogin.value) {
    authRef.value?.show()
  }
})

// 路由级背景管理已由 App.vue 中的 router.beforeEach 统一处理
// 这里不需要在 onUnmounted 里清空。

function onLoginSuccess() {
  // 登录成功后刷新数据
  console.log('登录成功')
}

function hideTabbar() {
  // 隐藏 tabbar
}

function showTabbar() {
  // 显示 tabbar
}

// 暴露方法给子组件回调
defineExpose({
  confirmRoleVoice(data) {
    console.log('confirmRoleVoice:', data)
    if (chatRef.value?.confirmRoleVoice) {
      chatRef.value.confirmRoleVoice(data)
    }
  }
})
</script>

<style lang="scss" scoped>
.group-chat-page {
  // 背景图由 App.vue 的 <AppBackground /> 全局渲染（position: fixed），
  // 这里只兜底一个深色背景。
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
}

// 半透明蒙版：压暗 <AppBackground /> 渲染的剧情背景图
.page-bg-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 0;
  pointer-events: none;
}
</style>
