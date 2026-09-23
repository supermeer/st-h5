<template>
  <van-popup
    v-model:show="visible"
    round
    :close-on-click-overlay="true"
    class="story-dialog"
    @click-overlay="handleMaskClick"
  >
    <div class="dialog-content">
      <!-- 关闭按钮 -->
      <div class="dialog-close" @click="handleClose">×</div>

      <!-- 标题 -->
      <div class="dialog-title">创建故事</div>

      <!-- 表单 -->
      <div class="dialog-form">
        <div class="form-item">
          <div class="form-label">故事名称</div>
          <van-field
            v-model="formData.title"
            placeholder="请输入故事名称"
            :maxlength="50"
            @input="(e) => onInputChange(e, 'title')"
          />
        </div>

        <div class="form-item">
          <div class="form-label">故事设定</div>
          <van-field
            v-model="formData.scene"
            type="textarea"
            placeholder="请输入故事设定"
            :maxlength="2000"
            autosize
            @input="(e) => onTextareaChange(e, 'scene')"
          />
        </div>

        <div class="form-item">
          <div class="form-label">开场白</div>
          <van-field
            v-model="formData.prologue"
            type="textarea"
            placeholder="请输入开场白"
            :maxlength="500"
            autosize
            @input="(e) => onTextareaChange(e, 'prologue')"
          />
        </div>

        <!-- 开场白角色选择 -->
        <div v-if="roles.length > 0" class="form-item">
          <div class="form-label">选择开场白角色</div>
          <div class="role-list">
            <div
              v-for="role in roles"
              :key="role.id"
              class="role-item"
              :class="{ active: formData.prologueCharacterId === role.id }"
              @click="onSelectPrologueCharacter(role.id)"
            >
              <img :src="role.avatarUrl" class="role-avatar" />
              <span class="role-name">{{ role.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="dialog-actions">
        <van-button size="large" round @click="handleCancel">取消</van-button>
        <van-button type="primary" size="large" round @click="handleConfirm">确定</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'

const visible = ref(false)
const roles = ref([])
const formData = ref({
  title: '',
  scene: '',
  prologue: '',
  prologueCharacterId: null
})

let _onCancel = null
let _onConfirm = null

function show(options = {}) {
  const {
    roles: r = [],
    onCancel,
    onConfirm
  } = options

  _onCancel = onCancel
  _onConfirm = onConfirm

  roles.value = r
  formData.value = {
    title: '',
    scene: '',
    prologue: '',
    prologueCharacterId: null
  }

  visible.value = true
}

function hide() {
  visible.value = false
  _onCancel = null
  _onConfirm = null
}

function handleClose() {
  if (typeof _onCancel === 'function') {
    _onCancel()
  }
  hide()
}

function handleCancel() {
  handleClose()
}

function handleMaskClick() {
  handleClose()
}

function onInputChange(e, field) {
  formData.value[field] = e.detail?.value ?? e
}

function onTextareaChange(e, field) {
  formData.value[field] = e.detail?.value ?? e
}

function onSelectPrologueCharacter(id) {
  if (formData.value.prologueCharacterId === id) {
    formData.value.prologueCharacterId = null
  } else {
    formData.value.prologueCharacterId = id
    // 回填该角色的开场白
    const role = roles.value.find(r => r.id === id)
    if (role?.prologue) {
      formData.value.prologue = role.prologue
    }
  }
}

function handleConfirm() {
  if (!formData.value.title) {
    showToast({ message: '请输入故事名称', icon: 'none' })
    return
  }
  if (!formData.value.scene) {
    showToast({ message: '请输入故事设定', icon: 'none' })
    return
  }
  if (!formData.value.prologue && formData.value.prologueCharacterId) {
    showToast({ message: '请输入开场白', icon: 'none' })
    return
  }

  if (typeof _onConfirm === 'function') {
    _onConfirm({
      title: formData.value.title,
      scene: formData.value.scene,
      prologue: formData.value.prologue,
      prologueCharacterId: formData.value.prologueCharacterId
    })
  }
  hide()
}

defineExpose({ show, hide })
</script>

<style lang="scss" scoped>
.story-dialog {
  max-height: 85vh;
  overflow-y: auto;
}

.dialog-content {
  position: relative;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.dialog-close {
  position: absolute;
  top: 32rpx;
  right: 32rpx;
  font-size: 48rpx;
  color: #999;
  z-index: 1;
}

.dialog-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 40rpx;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.form-item {
  .form-label {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 16rpx;
  }
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.role-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx;
  border-radius: 16rpx;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #fff5f0;
    border: 2px solid #FF5F15;
  }
}

.role-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  object-fit: cover;
}

.role-name {
  font-size: 24rpx;
  color: #333;
}

.dialog-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 48rpx;

  :deep(.van-button) {
    flex: 1;
  }
}
</style>
