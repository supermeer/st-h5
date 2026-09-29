<template>
  <div class="page">
    <!-- <van-nav-bar title="注册账号" left-arrow @click-left="onBack" /> -->
    <custom-nav-bar title="注册账号" @click-left="onBack" />

    <div class="page-content">
      <div class="logo-area">
        <div class="logo">星语酒馆</div>
        <div class="desc">创建账号，开启你的星语之旅</div>
      </div>

      <van-form @submit="onRegister" class="form">
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
            v-model="nickname"
            name="nickname"
            label="昵称"
            placeholder="请输入昵称"
            left-icon="user-o"
            maxlength="20"
            :rules="[
              { required: true, message: '请输入昵称' },
              { validator: nicknameValidator, message: '昵称不能仅包含空格' }
            ]"
          />
          <van-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            label="密码"
            placeholder="8-32 位，含大小写字母与数字"
            left-icon="lock"
            autocomplete="new-password"
            :right-icon="showPassword ? 'closed-eye' : 'eye-o'"
            @click-right-icon="showPassword = !showPassword"
            :rules="[{ validator: passwordValidator, message: '密码需 8-32 位且包含大小写字母与数字' }]"
          />
          <van-field
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            name="confirmPassword"
            label="确认"
            placeholder="请再次输入密码"
            left-icon="lock"
            autocomplete="new-password"
            :right-icon="showConfirmPassword ? 'closed-eye' : 'eye-o'"
            @click-right-icon="showConfirmPassword = !showConfirmPassword"
            :rules="[
              { required: true, message: '请再次输入密码' },
              { validator: confirmValidator, message: '两次输入的密码不一致' }
            ]"
          />
        </van-cell-group>

        <div class="agreement">
          <van-checkbox v-model="agreed" shape="square" icon-size="14rpx">
            <span class="agreement-text">
              我已阅读并同意
              <span class="link" @click.stop="goAgreement('user')">《用户协议》</span>
              <span class="link" @click.stop="goAgreement('privacy')">《隐私政策》</span>
            </span>
          </van-checkbox>
        </div>

        <div class="action-bar">
          <van-button
            type="primary"
            native-type="submit"
            block
            round
            :loading="loading"
            :disabled="!agreed"
            loading-text="注册中..."
          >
            注册
          </van-button>
        </div>

        <div class="links">
          <span class="link" @click="goLogin">已有账号？立即登录</span>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { register, resendVerification } from '@/api/auth'

const router = useRouter()

const email = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const agreed = ref(false)
const loading = ref(false)

const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const passwordValidator = (val) => {
  if (!val) return true // 必填规则由 required 触发
  if (val.length < 8 || val.length > 32) return false
  return /[a-z]/.test(val) && /[A-Z]/.test(val) && /\d/.test(val)
}
const nicknameValidator = (val) => !!val && !!val.trim()
const confirmValidator = (val) => !!val && val === password.value

const onBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/pages/home/home')
  }
}

const goLogin = () => router.replace('/pages/login/index')
const goAgreement = (type) => {
  router.push({
    path: '/pages/common/agreement/index',
    query: { type }
  })
}

const onRegister = async () => {
  if (loading.value) return
  if (!agreed.value) {
    showToast('请先阅读并同意用户协议与隐私政策')
    return
  }
  loading.value = true
  try {
    const res = await register({
      email: email.value.trim(),
      password: password.value,
      nickname: nickname.value.trim()
    })

    router.replace({
      path: '/pages/login/index',
      query: { email: email.value.trim() }
    })
    return
    // 文档约定 data 可能只返回 { userId, email, message }
    const message = res?.message || '注册成功，请前往邮箱完成验证'
    showDialog({
      title: '注册成功',
      message,
      confirmButtonText: '前往登录',
      cancelButtonText: '重发验证邮件',
      showCancelButton: true,
      closeOnClickOverlay: false
    })
      .then(async (action) => {
        if (action === 'confirm') {
          router.replace({
            path: '/pages/login/index',
            query: { email: email.value.trim() }
          })
        } else if (action === 'cancel') {
          try {
            await resendVerification(email.value.trim())
            showToast('验证邮件已重新发送')
          } catch (e) {
            console.error('resend error', e)
          }
        }
      })
      .catch(() => {
        router.replace({
          path: '/pages/login/index',
          query: { email: email.value.trim() }
        })
      })
  } catch (err) {
    console.error('register error', err)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  flex: 1 1 auto;          // 让 .page 在 flex 列容器中撑满
  min-height: 100vh;
  background-color: var(--theme-color-black);
  color: #fff;
}

.page-content {
  padding-bottom: 60rpx;
}

.logo-area {
  padding: 80rpx 0 32rpx;
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
  color: var(--desc-color-white);
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
    width: 60rpx;
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

.agreement {
  padding: 24rpx 18rpx 0;
  font-size: 16rpx;
  color: var(--desc-color);
  :deep(.van-checkbox__icon) {
    border-color: var(--desc-color);
  }
  :deep(.van-checkbox__icon--checked .van-icon) {
    background: var(--theme-color);
    border-color: var(--theme-color);
  }
  .agreement-text {
    color: var(--desc-color);
    line-height: 1.4;
  }
  .link {
    color: var(--theme-color-purple);
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
  justify-content: center;
  padding: 24rpx 18rpx 0;
  font-size: 14rpx;
}
.link {
  color: var(--theme-color-purple);
  cursor: pointer;
}
</style>
