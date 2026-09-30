<template>
  <div class="page">
    <div class="page-content">
      <div class="logo-area">
        <div class="logo">星语酒馆</div>
        <div class="desc">欢迎回来，请登录你的账号</div>
      </div>

      <van-form @submit="onLogin" class="form">
        <van-cell-group class="cell-group">
          <van-field
            v-model="email"
            name="email"
            type="email"
            label="邮箱"
            placeholder="请输入邮箱"
            left-icon="envelop-o"
            autocomplete="username"
            :rules="[
              { required: true, message: '请输入邮箱' },
              { pattern: emailPattern, message: '邮箱格式不正确' }
            ]"
          />
          <van-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            label="密码"
            placeholder="请输入密码"
            left-icon="lock"
            autocomplete="current-password"
            :right-icon="showPassword ? 'closed-eye' : 'eye-o'"
            @click-right-icon="showPassword = !showPassword"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="action-bar">
          <van-button
            type="primary"
            native-type="submit"
            block
            round
            :loading="loading"
            loading-text="登录中..."
          >
            登录
          </van-button>
        </div>

        <div class="links">
          <span class="link" @click="goForgot">忘记密码？</span>
          <span class="link" @click="goRegister">注册新账号</span>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { loginByEmail } from '@/api/auth'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const onBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/pages/home/home')
  }
}

const goRegister = () => router.push('/pages/register/index')
const goForgot = () => {
  // 当前接口文档未提供"忘记密码"接口，先提示用户联系支持
  showToast('请通过"修改密码"功能或联系客服重置密码')
}

const onLogin = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await loginByEmail({ email: email.value.trim(), password: password.value })
    if (!res || !res.token) {
      showToast(res?.message || '登录失败，请稍后重试')
      return
    }
    await userStore.setLoginSuccess({
      token: res.token,
      userId: res.userId,
      user: res.user
    })
    showToast({ type: 'success', message: '登录成功' })
    // 登录成功后回到上一页或首页
    const redirect = router.currentRoute.value.query.redirect
    router.replace(redirect || '/pages/home/home')
  } catch (err) {
    // http 拦截器已统一 toast 业务错误，这里只需兜底
    console.error('login error', err)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: var(--theme-color-black);
  color: #fff;
}

.page-content {
  padding-bottom: 60rpx;
}

.logo-area {
  padding: 80rpx 0 48rpx;
  text-align: center;
}
.logo {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--theme-color-purple);
}
.desc {
  margin-top: 16rpx;
  font-size: 20rpx;
  color: var(--desc-color);
}

.cell-group {
  // 整个输入模块使用全局毛玻璃效果（utils: .blur-glass）
  background: rgba(100, 100, 100, 0.2);
  backdrop-filter: blur(3.8px);
  -webkit-backdrop-filter: blur(3.8px);
  border-radius: 20rpx;
  padding: 8rpx 0;
  margin: 0 24rpx;
  overflow: hidden;

  // 覆盖 Vant 4 的字段背景 CSS 变量（默认是白色）
  --van-field-input-background-color: transparent;
  --van-field-background: transparent;

  :deep(.van-cell) {
    // 输入框背景全透明
    background: transparent;
    color: #fff;
    margin: 0;
    border-radius: 0;
    padding: 18rpx 14rpx;
  }
  :deep(.van-cell::after) {
    // 去掉 Vant 默认的下边框线
    border: none;
  }
  :deep(.van-field__label) {
    color: var(--desc-color);
    width: 40rpx;
  }
  :deep(.van-field__body) {
    background: transparent;
  }
  :deep(.van-field__control) {
    color: #fff;
    background: transparent;
    // 部分浏览器对 input 默认白底
    -webkit-box-shadow: 0 0 0 1000px transparent inset;
  }
  // 修复浏览器自动填充（autofill）时的白底 / 蓝字：覆盖到真实的 <input>
  :deep(input.van-field__control),
  :deep(textarea.van-field__control) {
    background-color: transparent !important;
    -webkit-text-fill-color: #fff !important;
    caret-color: #fff;
    box-shadow: 0 0 0 1000px transparent inset !important;
  }
  :deep(input.van-field__control:-webkit-autofill),
  :deep(input.van-field__control:-webkit-autofill:hover),
  :deep(input.van-field__control:-webkit-autofill:focus),
  :deep(input.van-field__control:-webkit-autofill:active) {
    -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
    -webkit-text-fill-color: #fff !important;
    transition: background-color 5000s ease-in-out 0s;
    caret-color: #fff;
  }
  :deep(.van-field__left-icon .van-icon),
  :deep(.van-field__right-icon .van-icon) {
    color: var(--desc-color);
  }
}

.action-bar {
  padding: 32rpx 24rpx 0;
}
:deep(.van-button--primary) {
  background: var(--theme-color-purple);
  border-color: var(--theme-color-purple);
}

.links {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 28rpx 0;
  font-size: 14rpx;
}
.link {
  color: var(--theme-color-purple);
  cursor: pointer;
}
</style>
