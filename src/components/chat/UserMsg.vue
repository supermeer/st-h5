<template>
  <div class="user-msg-wrapper">
    <div class="msg-main">
      <!-- 气泡内容 -->
      <div
        :id="`msg-content-${message.id}`"
        class="bubble"
        @click="onBubbleClick"
        @longpress="onLongPress"
      >
        <!-- 图片消息 -->
        <template v-if="hasImages">
          <div class="image-list">
            <img
              v-for="(img, idx) in images"
              :key="idx"
              :src="getImageUrl(img)"
              class="msg-image"
              mode="aspectFill"
              @click="previewImage(idx)"
            />
          </div>
        </template>
        
        <!-- 文字消息 -->
        <template v-if="message.content">
          <div class="msg-text blur-glass">{{ message.content }}</div>
        </template>
      </div>

      <!-- 错误状态 -->
      <div v-if="message.error" class="error-tip">
        <span>发送失败</span>
        <span class="retry-btn" @click="onRetry">重试</span>
      </div>
    </div>

    <!-- 用户头像 -->
    <div v-if="showUserName" class="avatar-wrap">
      <img
        v-if="userAvatar"
        :src="userAvatar"
        class="avatar"
        mode="aspectFill"
      />
      <div v-else class="avatar avatar-default">
        {{ userName ? userName.charAt(0) : '我' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'buttonClick',
  'maskShow',
  'retry'
])

const userAvatar = ref('')
const userName = ref('')

const showUserName = computed(() => {
  return props.groupDetail.id
})

const images = computed(() => {
  if (!props.message.images) return []
  return Array.isArray(props.message.images) ? props.message.images : []
})

const hasImages = computed(() => {
  return images.value.length > 0
})

function getImageUrl(img) {
  if (typeof img === 'string') return img
  return img.url || img.localUrl || ''
}

function onBubbleClick() {
  // 处理气泡点击
}

function onLongPress() {
  if (props.disabled) {
    window.wx?.showToast?.({ title: '对话生成中，请稍候...', icon: 'none' })
    return
  }

  if (!props.message.id) return

  // 震动反馈
  window.navigator?.vibrate?.({ short: 10 })

  // 获取元素位置并触发蒙版显示
  const el = document.getElementById(`msg-content-${props.message.id}`)
  if (el) {
    const rect = el.getBoundingClientRect()
    const screenWidth = window.innerWidth || 375
    emit('maskShow', {
      show: true,
      buttonTop: Math.max(rect.top + 20, 20),
      buttonRight: screenWidth - rect.right + 24,
      messageId: props.message.id,
      messageType: 'user'
    })
  }
}

function previewImage(current) {
  const urls = images.value.map(img => getImageUrl(img))
  window.wx?.previewImage?.({ urls, current: urls[current] })
}

function onRetry() {
  emit('retry', { messageId: props.message.id })
}

function onActionClick(action, include = true) {
  if (props.disabled) {
    window.wx?.showToast?.({ title: '对话生成中，请稍候...', icon: 'none' })
    return
  }
  emit('buttonClick', { action, current: props, messageId: props.message.id, include })
}

// 初始化用户信息
try {
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
  userAvatar.value = userInfo.avatarUrl || ''
  userName.value = userInfo.nickname || ''
} catch (e) {
  console.error('获取用户信息失败', e)
}
</script>

<style lang="scss" scoped>
.user-msg-wrapper {
  display: flex;
  padding: 8rpx 32rpx 8rpx 12rpx;
  gap: 8rpx;
  align-items: flex-start;
  flex-direction: row-reverse;
}

.msg-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.bubble {
  display: inline-block;
  max-width: 80%;
  padding: 24rpx 32rpx;
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border-radius: 24rpx;
  border-top-right-radius: 8rpx;
  font-size: 30rpx;
  line-height: 1.6;
  color: #fff;
  word-break: break-word;
}

.msg-text {
  word-break: break-word;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
  max-width: 400rpx;
}

.msg-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  object-fit: cover;
}

.error-tip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 8rpx;
  font-size: 16rpx;
  color: #999;
}

.retry-btn {
  color: #FF5F15;
  cursor: pointer;
  &:hover { opacity: 0.8; }
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  object-fit: cover;

  &.avatar-default {
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 16rpx;
    font-weight: bold;
  }
}
</style>
