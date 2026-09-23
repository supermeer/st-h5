<template>
  <div class="group-chat-page">
    <!-- 背景 -->
    <div 
      v-if="currentBg" 
      class="page-bg" 
      :style="{ backgroundImage: `url(${currentBg})` }"
    ></div>
    <div v-if="currentBg" class="page-bg-mask"></div>

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
import { ref, computed, onMounted, provide } from 'vue'
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
const currentBg = ref('')

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
  min-height: 100vh;
  background: #1a1a1a;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.page-bg-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1;
}
</style>
