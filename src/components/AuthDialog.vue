<template>
  <van-popup
    v-model:show="visible"
    :close-on-click-overlay="false"
    round
    class="auth-dialog"
    @closed="onClosed"
  >
    <div class="auth-content">
      <!-- 手机号绑定 -->
      <template v-if="phoneLogin">
        <div class="auth-title">绑定手机号</div>
        <div class="auth-desc">登录后即可体验完整功能</div>
        <van-button
          type="primary"
          block
          round
          class="auth-btn"
          @click="onGetPhone"
        >
          微信授权手机号
        </van-button>
        <div class="auth-skip" @click="visible = false">跳过</div>
      </template>

      <!-- 微信登录 -->
      <template v-else>
        <div class="auth-title">登录星语酒馆</div>
        <div class="auth-desc">登录后开启 AI 角色对话之旅</div>
        <div class="auth-logo">
          <span class="logo-text">🌟</span>
        </div>
        <van-button
          type="primary"
          block
          round
          class="auth-btn"
          :loading="logging"
          @click="onLogin"
        >
          {{ logging ? '登录中...' : '微信一键登录' }}
        </van-button>
        <div v-if="logErr" class="auth-error">登录失败，请重试</div>
      </template>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, watch } from 'vue'
import { showToast } from 'vant'
import { login } from '@/api/usercenter'
import { useUserStore } from '@/store/user'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  checkPhone: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'loginSuccess', 'bindPhoneSuccess'])

const userStore = useUserStore()
const visible = ref(false)
const phoneLogin = ref(false)
const logging = ref(false)
const logErr = ref(false)

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (!v) {
    phoneLogin.value = false
    logErr.value = false
  }
})
watch(visible, (v) => emit('update:modelValue', v))

function onClosed() {
  phoneLogin.value = false
  logErr.value = false
}

function show() {
  visible.value = true
  phoneLogin.value = false
  logErr.value = false
}

function onLogin() {
  logging.value = true
  logErr.value = false
  userStore.setLoginMark(true)
  // H5 mock 登录（真实场景需要微信 OAuth）
  login({ code: 'mock-h5-code-' + Date.now() })
    .then((result) => {
      userStore.setLoginSuccess(result)
      const needPhone = props.checkPhone && !result.user?.phone
      phoneLogin.value = needPhone
      if (needPhone) {
        visible.value = true
      } else {
        visible.value = false
        emit('loginSuccess')
        // 触发全局事件，让所有监听者（不限于父组件）都能感知登录成功
        // （对应小程序中通过 westore 状态变更驱动全局响应）
        window.dispatchEvent(new CustomEvent('h5:user-login-success', { detail: result }))
      }
    })
    .catch(() => {
      logErr.value = true
    })
    .finally(() => {
      logging.value = false
      userStore.setLoginMark(false)
    })
}

function onGetPhone() {
  showToast('请在微信环境中使用手机号登录')
}

// 暴露方法给父组件调用
defineExpose({ show })
</script>

<style lang="scss" scoped>
.auth-dialog {
  width: 600rpx;
  background: #252525;
  border-radius: 24rpx;
  overflow: hidden;
}
.auth-content {
  padding: 60rpx 48rpx;
  text-align: center;
  color: #fff;
}
.auth-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}
.auth-desc {
  font-size: 26rpx;
  color: #aaa;
  margin-bottom: 48rpx;
}
.auth-logo {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 48rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF5F15, #FF9500);
}
.logo-text {
  font-size: 80rpx;
  line-height: 1;
}
.auth-btn {
  margin-top: 24rpx;
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border: none;
}
.auth-skip {
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #888;
}
.auth-error {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #ff4444;
}
</style>
