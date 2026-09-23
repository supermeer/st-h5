<template>
  <div class="my-setting-page">
    <CustomNav title="我的设定" :show-back="true" />
    
    <div class="page-content">
      <div class="setting-form">
        <!-- 称呼 -->
        <div class="form-item">
          <div class="form-label">称呼</div>
          <div class="form-input">
            <van-field
              v-model="formData.userAddressedAs"
              placeholder="智能体如何称呼你"
              input-align="right"
            />
          </div>
        </div>

        <!-- 性别 -->
        <div class="form-item">
          <div class="form-label">性别</div>
          <div class="form-selector">
            <div 
              v-for="g in genderList" 
              :key="g"
              class="gender-btn"
              :class="{ active: formData.gender === g }"
              @click="formData.gender = g"
            >
              {{ g }}
            </div>
          </div>
        </div>

        <!-- 我是谁 -->
        <div class="form-item textarea-item">
          <div class="form-label">我是谁</div>
          <div class="form-input">
            <van-field
              v-model="formData.identity"
              type="textarea"
              placeholder="设定你在故事中的身份，帮助智能体更好地理解你们的关系"
              :rows="4"
              autosize
              maxlength="500"
              show-word-limit
            />
          </div>
        </div>
      </div>

      <!-- 提示 -->
      <div v-if="isGlobal" class="global-tip">
        <van-icon name="info-o" class="tip-icon" />
        <span>对已设置好的智能体不作变更，仅对后续新聊天的智能体作默认设置。</span>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <van-button 
        v-if="!isGlobal && formData.id" 
        type="default" 
        block 
        round
        class="reset-btn"
        @click="onReset"
      >
        重置
      </van-button>
      <van-button 
        type="primary" 
        block 
        round
        class="submit-btn"
        @click="onSubmit"
      >
        保存
      </van-button>
    </div>

    <TipDialog ref="tipDialogRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'
import { createPersona, getPersonaDetail, updatePersona, getDefaultPersona, updateDefaultPersona, deleteDefaultPersona } from '@/api/role'

const route = useRoute()
const router = useRouter()

const tipDialogRef = ref(null)

const formData = ref({
  id: null,
  userAddressedAs: '',
  gender: '',
  identity: ''
})

const isGlobal = ref(false)
const plotId = ref(null)

const genderList = ['男', '女', '其他']

onMounted(() => {
  const { personaId, avatarUrl, isGlobal: global, plotId: pid, gender, userAddressedAs, identity } = route.query
  
  if (isGlobal === 'true') {
    isGlobal.value = true
    loadGlobalPersona()
  } else if (personaId) {
    formData.value.id = personaId
    loadPersonaDetail(personaId)
  }
  
  if (plotId) {
    plotId.value = pid
  }
  
  if (gender || userAddressedAs || identity) {
    formData.value.gender = gender || ''
    formData.value.userAddressedAs = userAddressedAs || ''
    formData.value.identity = identity || ''
  }
})

async function loadGlobalPersona() {
  try {
    const res = await getDefaultPersona()
    formData.value = {
      ...formData.value,
      ...res
    }
  } catch (e) {
    console.error('加载默认设定失败', e)
  }
}

async function loadPersonaDetail(id) {
  try {
    const res = await getPersonaDetail(id)
    formData.value = {
      ...formData.value,
      ...res
    }
  } catch (e) {
    console.error('加载设定失败', e)
  }
}

function onReset() {
  tipDialogRef.value?.show({
    content: '确认重置设定？',
    cancelText: '取消',
    confirmText: '确认',
    onConfirm: async () => {
      try {
        await deleteDefaultPersona()
        showToast({ message: '重置成功', icon: 'success' })
        setTimeout(() => router.back(), 1000)
      } catch (e) {
        showToast({ message: '重置失败', icon: 'none' })
      }
    }
  })
}

function onSubmit() {
  if (isGlobal.value) {
    updateGlobalPersona()
    return
  }

  if (formData.value.id) {
    updatePersonaData()
    return
  }

  if (!plotId.value) {
    // 无 plotId，直接返回上一页
    const prevPage = window.__prevPage
    if (prevPage && typeof prevPage.confirmUserSettings === 'function') {
      prevPage.confirmUserSettings({
        userAddressedAs: formData.value.userAddressedAs,
        identity: formData.value.identity,
        personaGender: formData.value.gender
      })
    }
    router.back()
    return
  }

  createPersonaData()
}

async function updateGlobalPersona() {
  try {
    await updateDefaultPersona(formData.value)
    showToast({ message: '更新成功', icon: 'success' })
    setTimeout(() => router.back(), 1000)
  } catch (e) {
    showToast({ message: '更新失败', icon: 'none' })
  }
}

async function updatePersonaData() {
  try {
    await updatePersona({
      ...formData.value
    })
    showToast({ message: '更新成功', icon: 'success' })
    setTimeout(() => router.back(), 1000)
  } catch (e) {
    showToast({ message: '更新失败', icon: 'none' })
  }
}

async function createPersonaData() {
  try {
    await createPersona({
      ...formData.value,
      plotId: plotId.value
    })
    showToast({ message: '保存成功', icon: 'success' })
    setTimeout(() => router.back(), 1000)
  } catch (e) {
    showToast({ message: '保存失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.my-setting-page {
  min-height: 100vh;
  background: #1a1a1a;
  padding-bottom: 200rpx;
}

.page-content {
  padding-top: 88px;
  padding: 88px 24rpx 0;
}

.setting-form {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 8rpx 0;
}

.form-item {
  padding: 24rpx 32rpx;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  font-size: 28rpx;
  color: #fff;
  margin-bottom: 16rpx;
}

.form-selector {
  display: flex;
  gap: 24rpx;
}

.gender-btn {
  padding: 16rpx 40rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 40rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #FF5F15;
    color: #fff;
  }

  &:active {
    transform: scale(0.98);
  }
}

.textarea-item {
  .form-label {
    margin-bottom: 16rpx;
  }
}

.global-tip {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-top: 32rpx;
  padding: 24rpx;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #FFD700;
  line-height: 1.5;
}

.tip-icon {
  flex-shrink: 0;
  margin-top: 2rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 50;
}

.reset-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
}

.submit-btn {
  flex: 2;
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border: none;
}
</style>
