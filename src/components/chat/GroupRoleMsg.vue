<template>
  <div class="group-role-msg-wrapper">
    <!-- 角色头像 -->
    <div class="avatar-wrap">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        class="avatar"
        mode="aspectFill"
      />
      <div v-else class="avatar avatar-default">
        {{ roleName ? roleName.charAt(0) : '?' }}
      </div>
    </div>

    <!-- 消息内容 -->
    <div class="msg-main">
      <!-- 角色名称 -->
      <div class="role-name">{{ roleName }}</div>

      <!-- 思考过程区域 -->
      <div v-if="hasThinking" class="think-section">
        <div class="think-header" @click="toggleThinking">
          <span class="think-icon">{{ thinkingExpanded ? '🔽' : '🔍' }}</span>
          <span class="think-label">思考过程</span>
          <span class="think-toggle">{{ thinkingExpanded ? '收起' : '展开' }}</span>
        </div>
        <div v-show="thinkingExpanded" class="think-content">
          <div class="think-text">{{ thinkContent }}</div>
        </div>
      </div>

      <!-- 气泡内容 -->
      <div
        :id="`msg-content-${message.id}`"
        class="bubble"
        :class="{ loading: message.loading }"
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
        <!-- 正常内容 -->
        <template v-else>
          <div class="msg-text">{{ message.content }}</div>
        </template>
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
  roles: {
    type: Array,
    default: () => []
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

const emit = defineEmits(['maskShow'])

const thinkingExpanded = ref(false)

const roleName = computed(() => {
  return props.message.roleName || props.message.name || 'AI'
})

const avatarUrl = computed(() => {
  return props.message.avatarUrl || ''
})

const thinkContent = computed(() => {
  return props.message.thinkContent || ''
})

const hasThinking = computed(() => {
  return props.message.hasThinking || props.message.thinkContent
})

function toggleThinking() {
  thinkingExpanded.value = !thinkingExpanded.value
}

function onLongPress() {
  if (props.disabled) {
    window.wx?.showToast?.({ title: '对话生成中，请稍候...', icon: 'none' })
    return
  }
  
  if (!props.message.id || props.message.loading) {
    return
  }

  window.navigator?.vibrate?.({ short: 10 })

  const el = document.getElementById(`msg-content-${props.message.id}`)
  if (el) {
    const rect = el.getBoundingClientRect()
    emit('maskShow', {
      show: true,
      buttonTop: Math.max(rect.top + 20, 20),
      buttonRight: 32,
      messageId: props.message.id,
      messageType: 'role'
    })
  }
}
</script>

<style lang="scss" scoped>
.group-role-msg-wrapper {
  display: flex;
  padding: 24rpx 32rpx;
  gap: 20rpx;
  align-items: flex-start;
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  object-fit: cover;

  &.avatar-default {
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 28rpx;
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

.msg-text {
  word-break: break-word;
  white-space: pre-wrap;
}
</style>
