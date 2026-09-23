<template>
  <div class="page">
    <van-nav-bar title="登录" left-arrow @click-left="onBack" />
    <div class="page-content">
      <div class="logo-area">
        <div class="logo">星语酒馆</div>
        <div class="desc">登录页占位（阶段1）</div>
      </div>
      <van-cell-group inset>
        <van-field v-model="phone" type="tel" label="手机号" placeholder="请输入手机号" />
        <van-field v-model="code" label="验证码" placeholder="6 位短信验证码" />
      </van-cell-group>
      <div class="action-bar">
        <van-button type="primary" block :loading="loading" @click="onLogin">
          登录（模拟）
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const loading = ref(false)

const onBack = () => router.back()

const onLogin = async () => {
  if (!/^1\d{10}$/.test(phone.value)) {
    showToast('请输入正确的手机号')
    return
  }
  loading.value = true
  // 阶段1 仅模拟登录：实际请求在阶段2 接入
  await new Promise((r) => setTimeout(r, 500))
  userStore.setLoginSuccess({
    token: 'mock-token-' + Date.now(),
    openId: 'mock-openId',
    user: {
      avatarUrl: '',
      nickname: '测试用户',
      uid: '1',
      phone: phone.value,
      state: '',
      id: 1,
      openId: 'mock-openId'
    }
  })
  showToast('登录成功（mock）')
  loading.value = false
  router.replace('/pages/home/home')
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: var(--theme-color-black);
  color: #fff;
}
.logo-area {
  padding: 80rpx 0 48rpx;
  text-align: center;
}
.logo {
  font-size: 48rpx;
  font-weight: bold;
  color: var(--theme-color);
}
.desc {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: var(--desc-color);
}
.action-bar {
  padding: 32rpx 24rpx;
}
</style>
