<template>
  <div
    class="role-msg-wrapper"
    :class="{ 'msg-error': message.error }"
  >
    <!-- 角色头像 -->
    <div class="avatar-wrap" @click="onRoleClick">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        class="avatar"
        mode="aspectFill"
        @error="onAvatarError"
      />
      <div v-else class="avatar avatar-default">
        {{ roleName ? roleName.charAt(0) : '?' }}
      </div>
    </div>

    <!-- 消息内容 -->
    <div class="msg-main">
      <!-- 角色名称 -->
      <div v-if="showRoleName" class="role-name">{{ roleName }}</div>

      <!-- 思考过程区域 -->
      <div v-if="hasThinking" class="think-section">
        <div class="think-header" @click="toggleThinking">
          <span class="think-icon">{{ thinkingExpanded ? '🔽' : '🔍' }}</span>
          <span class="think-label">思考过程</span>
          <span class="think-toggle">{{ thinkingExpanded ? '收起' : '展开' }}</span>
        </div>
        <div v-show="thinkingExpanded" class="think-content">
          <div class="think-html" v-html="thinkHtmlContent"></div>
        </div>
      </div>

      <!-- 气泡内容 -->
      <div
        :id="`msg-content-${message.id}`"
        class="bubble"
        :class="{ loading: message.loading }"
        @click="onBubbleClick"
        @longpress="onLongPress"
      >
        <!-- Loading 状态 -->
        <template v-if="message.loading">
          <span class="loading-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </template>
        <!-- 错误状态 -->
        <template v-else-if="message.error">
          <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-text">生成失败</span>
            <van-button size="small" type="primary" @click.stop="onRetry">重试</van-button>
          </div>
        </template>
        <!-- 正常内容 -->
        <template v-else>
          <div class="msg-html" v-html="htmlContent"></div>
        </template>
      </div>

      <!-- 操作按钮（消息生成完成后显示） -->
      <div v-if="!message.loading && !message.error && isLatest" class="msg-actions">
        <span class="action-btn" data-action="like" @click="onActionClick('like')">👍</span>
        <span class="action-btn" data-action="dislike" @click="onActionClick('dislike')">👎</span>
        <span class="action-btn" data-action="retry" @click="onActionClick('retry')">🔄</span>
        <span class="action-btn" data-action="continue" @click="onActionClick('continue')">▶️</span>
        <span class="action-btn" data-action="copy" @click="onActionClick('copy')">📋</span>
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
  roleDetail: {
    type: Object,
    default: () => ({})
  },
  groupDetail: {
    type: Object,
    default: () => ({})
  },
  plotInfo: {
    type: Object,
    default: () => ({})
  },
  isLatest: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'buttonClick',
  'maskShow',
  'retry',
  'roleClick'
])

const thinkingExpanded = ref(false)

const avatarUrl = computed(() => {
  return props.message.avatarUrl || props.roleDetail.avatarUrl || ''
})

const roleName = computed(() => {
  return props.message.roleName || props.message.name || props.roleDetail.name || 'AI'
})

const showRoleName = computed(() => {
  return !props.groupDetail.id && roleName.value
})

const htmlContent = computed(() => {
  return props.message.htmlContent || ''
})

const thinkHtmlContent = computed(() => {
  return props.message.thinkHtmlContent || ''
})

const hasThinking = computed(() => {
  return props.message.hasThinking || props.message.thinkContent
})

function toggleThinking() {
  thinkingExpanded.value = !thinkingExpanded.value
}

function onRoleClick() {
  emit('roleClick', props.message)
}

function onBubbleClick() {
  // 处理气泡点击
}

function onLongPress() {
  if (props.disabled) {
    window.wx?.showToast?.({ title: '对话生成中，请稍候...', icon: 'none' })
    return
  }
  
  if (!props.message.id || props.message.loading || props.message.error) {
    return
  }

  // 震动反馈
  window.navigator?.vibrate?.({ short: 10 })

  // 获取元素位置并触发蒙版显示
  const el = document.getElementById(`msg-content-${props.message.id}`)
  if (el) {
    const rect = el.getBoundingClientRect()
    emit('maskShow', {
      show: true,
      buttonTop: Math.max(rect.top + 20, 20),
      buttonLeft: rect.left + 24,
      messageId: props.message.id,
      messageType: 'role'
    })
  }
}

function onActionClick(action) {
  if (props.disabled) {
    window.wx?.showToast?.({ title: '对话生成中，请稍候...', icon: 'none' })
    return
  }
  emit('buttonClick', { action, current: props, messageId: props.message.id })
}

function onRetry() {
  emit('retry', { messageId: props.message.id })
}

function onAvatarError(e) {
  // 头像加载失败，使用默认头像
}
</script>

<style lang="scss" scoped>
.role-msg-wrapper {
  display: flex;
  padding: 24rpx 32rpx;
  gap: 20rpx;
  align-items: flex-start;

  &.msg-error {
    opacity: 0.8;
  }
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  object-fit: cover;

  &.avatar-default {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 32rpx;
    font-weight: bold;
  }
}

.msg-main {
  flex: 1;
  min-width: 0;
}

.role-name {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
  padding-left: 16rpx;
}

.think-section {
  margin-bottom: 12rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  overflow: hidden;
}

.think-header {
  display: flex;
  align-items: center;
  padding: 12rpx 16rpx;
  cursor: pointer;
  font-size: 24rpx;
  color: #666;
  gap: 8rpx;
}

.think-icon {
  font-size: 24rpx;
}

.think-label {
  flex: 1;
}

.think-toggle {
  color: #999;
}

.think-content {
  padding: 0 16rpx 16rpx;
  font-size: 26rpx;
  color: #888;
  max-height: 300rpx;
  overflow-y: auto;
}

.bubble {
  display: inline-block;
  max-width: 100%;
  padding: 24rpx 32rpx;
  background: #fff;
  border-radius: 24rpx;
  border-top-left-radius: 8rpx;
  font-size: 30rpx;
  line-height: 1.6;
  word-break: break-word;

  &.loading {
    min-width: 120rpx;
    text-align: center;
  }
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8rpx;

  .dot {
    width: 12rpx;
    height: 12rpx;
    background: #ccc;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #999;
  font-size: 26rpx;
}

.error-icon {
  font-size: 28rpx;
}

.error-text {
  flex: 1;
}

.msg-html {
  :deep(p) {
    margin: 0 0 16rpx 0;
    &:last-child { margin-bottom: 0; }
  }
}

.msg-actions {
  display: flex;
  gap: 16rpx;
  padding-left: 16rpx;
  margin-top: 8rpx;
}

.action-btn {
  font-size: 28rpx;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}
</style>
