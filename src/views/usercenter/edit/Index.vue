<template>
  <div class="profile-edit-page">
    <CustomNav title="" transparent :show-back="true" :show-home="false" />

    <div class="scroll-content">
      <div class="form-content">
        <!-- 头像 -->
        <div class="form-section blur-glass">
          <div class="form-item">
            <div class="form-label">头像</div>
            <div class="avatar-row" @click="onChangeAvatar">
              <img class="avatar-image" :src="previewAvatar || userInfo.avatarUrl || defaultAvatar" alt="" />
              <div class="avatar-edit-text">点击更换头像</div>
            </div>
          </div>
        </div>

        <!-- 昵称 -->
        <div class="form-section blur-glass">
          <div class="form-item form-item-row">
            <div class="form-label">
              <span class="label-required">*</span>
              <span>昵称</span>
            </div>
            <input
              v-model="nickname"
              class="form-input form-input-inline"
              placeholder="请输入昵称"
              maxlength="20"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="submit-footer">
      <div class="submit-btn" :class="{ disabled: saving }" @click="onSave">
        {{ saving ? '保存中...' : '保存' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { useUserStore } from '@/store/user'
import { updateUserInfo } from '@/api/usercenter'

const router = useRouter()
const userStore = useUserStore()

const defaultAvatar = '/static/usercenter/user_icon.png'
const userInfo = computed(() => userStore.userInfo || {})
const nickname = ref(userInfo.value.nickname || '')
const previewAvatar = ref('')
const uploaded = ref({ remoteUrl: '', fileKey: '' })
const saving = ref(false)

function onChangeAvatar() {
  router.push('/pages/common/cropper/index')
  // 监听 cropper 完成事件
  const handler = (e) => {
    const detail = e.detail || {}
    const { remoteUrl, fileKey, localPath } = detail
    if (!fileKey) return
    previewAvatar.value = localPath || ''
    uploaded.value = { remoteUrl, fileKey }
    window.removeEventListener('h5:cropper-done', handler)
  }
  window.addEventListener('h5:cropper-done', handler)
}

async function onSave() {
  const name = (nickname.value || '').trim()
  if (!name) {
    showToast('请输入昵称')
    return
  }
  saving.value = true
  try {
    const avatarUrl = uploaded.value.remoteUrl || userInfo.value.avatarUrl || ''
    await updateUserInfo({ nickname: name, avatarUrl })
    userStore.updateUser({ nickname: name, avatarUrl })
    showToast('已保存')
    setTimeout(() => router.back(), 500)
  } catch (e) {
    showToast('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.profile-edit-page {
  min-height: 100vh;
  background: #1a1a20;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 88rpx 0 0;
}

.form-content {
  padding: 24rpx 24rpx calc(var(--safearea-bottom) + 100rpx);
}

.form-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.form-item {
  padding: 32rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.form-item-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.form-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
}

.form-item-row .form-label {
  margin-bottom: 0;
  flex-shrink: 0;
}

.label-required {
  color: #f87171;
  margin-right: 4rpx;
}

.form-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 28rpx;
  color: #fff;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.form-input-inline {
  flex: 1;
  text-align: right;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  cursor: pointer;
}

.avatar-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  object-fit: cover;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.avatar-edit-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.submit-footer {
  background: rgba(20, 20, 30, 0.95);
  padding: 16rpx 24rpx calc(var(--safearea-bottom) + 16rpx);
  border-top: 1rpx solid rgba(255, 255, 255, 0.05);
}

.submit-btn {
  height: 88rpx;
  background: linear-gradient(135deg, #6c5ce7 0%, #174dff 100%);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  cursor: pointer;

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
