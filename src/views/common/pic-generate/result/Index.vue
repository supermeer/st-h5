<template>
  <div class="result-page">
    <CustomNav title="生成图片" :show-back="status === 'success' || status === 'failed'" :show-home="false" :transparent="true" />

    <!-- 生成中状态 -->
    <div v-if="status === 'generating'" class="generating-container">
      <div class="card-container">
        <div class="progress-card blur-glass">
          <div class="loading-circle">
            <div class="circle-inner"></div>
          </div>
          <div class="progress-text">
            <div class="status-text">生成中</div>
            <div class="percent-text">{{ progress }}%</div>
          </div>
          <div class="estimated-time">大概需要{{ estimatedTime }}</div>
        </div>
        <div class="bottom-tip">请勿退出</div>
      </div>
    </div>

    <!-- 生成成功状态 -->
    <div v-else-if="status === 'success'" class="success-container">
      <div class="avatar-section">
        <div class="avatar-card blur-glass">
          <div class="avatar-wrapper" @click="onSetAvatar">
            <img
              class="avatar-image"
              :src="avatarUrl || imageUrl"
              alt=""
            />
            <div class="avatar-overlay">
              <div class="avatar-icon">📷</div>
              <div class="avatar-text">设置头像</div>
            </div>
          </div>
          <div class="avatar-tip">点击设置</div>
        </div>
      </div>

      <div class="image-container" :style="imageCardStyle">
        <div class="image-card">
          <img class="generated-image" :src="imageUrl" alt="" />
        </div>
      </div>

      <div class="action-footer">
        <div class="action-buttons">
          <div class="action-btn secondary" @click="onBackToChat">返回</div>
          <div class="action-btn primary" @click="onUseAsBackground">使用该图片作为背景</div>
        </div>
      </div>
    </div>

    <!-- 生成失败状态 -->
    <div v-else-if="status === 'failed'" class="failed-container">
      <div class="card-container">
        <div class="failed-card blur-glass">
          <div class="failed-icon">
            <div class="icon-circle">
              <span class="icon-text">✕</span>
            </div>
          </div>
          <div class="failed-text">
            <div class="status-text">生成失败</div>
            <div class="error-message">{{ errorMessage }}</div>
          </div>
        </div>
      </div>
      <div class="action-footer">
        <div class="action-buttons">
          <div class="action-btn secondary" @click="onBackToChat">返回</div>
          <div class="action-btn primary" @click="onRegenerate">重新生成</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'

const route = useRoute()
const router = useRouter()

const status = ref('generating') // 'generating' | 'success' | 'failed'
const progress = ref(0)
const estimatedTime = ref('3分钟')
const imageUrl = ref('')
const avatarUrl = ref('')
const generateParams = ref(null)
const errorMessage = ref('')
const imageCardStyle = ref('')

let progressTimer = null

onMounted(() => {
  calculateImageCardSize()
  if (route.query.params) {
    try {
      const params = JSON.parse(decodeURIComponent(String(route.query.params)))
      generateParams.value = params
    } catch (e) {
      console.error('解析参数失败:', e)
    }
  }
  startGenerate()
})

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
  }
})

function calculateImageCardSize() {
  const windowHeight = window.innerHeight
  const windowWidth = window.innerWidth
  const navHeight = 44
  const avatarHeight = 240
  const footerBtnHeight = 96
  const safeAreaBottom = 0
  const ratio = windowWidth / windowHeight
  imageCardStyle.value = `height: calc(100vh - ${navHeight}px - ${avatarHeight}px - ${footerBtnHeight}px - ${safeAreaBottom}px); width: calc(${ratio} * (100vh - ${navHeight}px - ${avatarHeight}px - ${footerBtnHeight}px - ${safeAreaBottom}px)); margin: 0 auto;`
}

function startGenerate() {
  // TODO: 调用真实 AI 生成图片接口
  console.log('开始生成图片:', generateParams.value)
  simulateProgress()
}

function simulateProgress() {
  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    let p = progress.value + Math.floor(Math.random() * 10) + 5
    if (p >= 100) {
      p = 100
      clearInterval(progressTimer)
      const isSuccess = Math.random() > 0.1
      setTimeout(() => {
        if (isSuccess) {
          status.value = 'success'
          progress.value = 100
          imageUrl.value = '/static/role-bg/xxg_bg_mini.jpg'
        } else {
          handleGenerateError('生成失败，请稍后重试')
        }
      }, 500)
      return
    }
    progress.value = p
  }, 300)
}

function handleGenerateError(msg) {
  status.value = 'failed'
  errorMessage.value = msg || '生成失败，请稍后重试'
  showToast(msg || '生成失败')
}

function onBackToChat() {
  router.back()
}

function onUseAsBackground() {
  if (!imageUrl.value) {
    showToast('图片不存在')
    return
  }
  showToast('设置成功')
  setTimeout(() => onBackToChat(), 1500)
}

function onRegenerate() {
  status.value = 'generating'
  progress.value = 0
  errorMessage.value = ''
  imageUrl.value = ''
  startGenerate()
}

function onSetAvatar() {
  if (!imageUrl.value) {
    showToast('图片不存在')
    return
  }
  // 跳转到裁剪页面
  router.push({
    path: '/pages/common/cropper/index',
    query: { src: encodeURIComponent(imageUrl.value) }
  })
}

function onSaveImage() {
  if (!imageUrl.value) {
    showToast('图片不存在')
    return
  }
  // 创建一个临时链接并触发下载
  const a = document.createElement('a')
  a.href = imageUrl.value
  a.download = 'generated_' + Date.now() + '.jpg'
  a.target = '_blank'
  a.click()
}
</script>

<style lang="scss" scoped>
.result-page {
  min-height: 100vh;
  background: #1a1a1a;
  color: #fff;
  padding-top: 88px;
}

.generating-container,
.success-container,
.failed-container {
  min-height: calc(100vh - 88px);
  padding: 24px 32px;
}

.card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
}

.progress-card,
.failed-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 32px;
  padding: 60px 48px;
  text-align: center;
  width: 100%;
  max-width: 600px;
}

.loading-circle {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto 32px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #FF5F15, transparent);
  animation: rotate 1.5s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-inner {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #1a1a1a;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

.progress-text {
  margin-bottom: 16px;
}

.status-text {
  font-size: 32px;
  color: #fff;
  margin-bottom: 8px;
}

.percent-text {
  font-size: 56px;
  font-weight: 700;
  color: #FF5F15;
}

.estimated-time {
  font-size: 26px;
  color: rgba(255, 255, 255, 0.6);
}

.bottom-tip {
  margin-top: 32px;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
}

.failed-icon {
  margin-bottom: 32px;
}

.icon-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid #EF4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.icon-text {
  font-size: 64px;
  color: #EF4444;
}

.failed-text {
  text-align: center;
}

.error-message {
  font-size: 26px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

/* 成功 */
.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 24px;
  text-align: center;
}

.avatar-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 12px;
  cursor: pointer;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-wrapper:hover .avatar-overlay,
.avatar-wrapper:active .avatar-overlay {
  opacity: 1;
}

.avatar-icon {
  font-size: 40px;
}

.avatar-text {
  font-size: 24px;
  color: #fff;
  margin-top: 4px;
}

.avatar-tip {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.5);
}

.image-container {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.image-card {
  border-radius: 24px;
  overflow: hidden;
}

.generated-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.action-footer {
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.action-btn {
  flex: 1;
  height: 88px;
  border-radius: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 500;
  cursor: pointer;

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &.primary {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    color: #fff;
  }
}
</style>
