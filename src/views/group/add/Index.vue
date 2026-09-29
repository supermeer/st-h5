<template>
  <div class="group-add-page">
    <CustomNav 
      :title="pageTitle" 
      :show-back="true" 
      @back="backAction" 
    />

    <div class="page-content">
      <!-- 群名称 -->
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <div class="form-item">
          <div class="form-label">群名称</div>
          <van-field
            v-model="formData.name"
            placeholder="请输入群名称"
            input-align="right"
            :border="false"
            @change="(e) => onInputChange(e, 'name')"
          />
        </div>
        <div class="form-item">
          <div class="form-label">群简介</div>
          <van-field
            v-model="formData.description"
            type="textarea"
            placeholder="请输入群简介"
            :rows="3"
            autosize
            maxlength="200"
            show-word-limit
            :border="false"
            @change="(e) => onTextareaChange(e, 'description')"
          />
        </div>
      </div>

      <!-- 群成员 -->
      <div class="form-section">
        <div class="section-title">
          <span>群成员</span>
          <span class="section-tip">至少选择2个角色</span>
        </div>
        
        <div class="character-list">
          <div 
            v-for="char in selectedCharacters" 
            :key="char.id"
            class="character-item"
          >
            <img class="character-avatar" :src="char.avatarUrl" alt="">
            <div class="character-name">{{ char.name }}</div>
            <div class="character-remove" @click="onRemoveCharacter(char.id)">
              <van-icon name="cross" size="24rpx" />
            </div>
          </div>
          <div class="character-add" @click="onAddCharacters">
            <van-icon name="plus" size="48rpx" />
          </div>
        </div>
      </div>

      <!-- 故事设定 -->
      <div class="form-section">
        <div class="section-title">故事设定</div>
        <div class="form-item">
          <div class="form-label">故事名称</div>
          <van-field
            v-model="formData.storyTitle"
            placeholder="请输入故事名称"
            input-align="right"
            :border="false"
            @change="(e) => onInputChange(e, 'storyTitle')"
          />
        </div>
        <div class="form-item">
          <div class="form-label">故事设定</div>
          <van-field
            v-model="formData.scene"
            type="textarea"
            placeholder="请输入故事设定，设定群聊中的世界观、场景等"
            :rows="4"
            autosize
            maxlength="1000"
            show-word-limit
            :border="false"
            @change="(e) => onTextareaChange(e, 'scene')"
          />
        </div>
        <div class="form-item">
          <div class="form-label">开场白</div>
          <van-field
            v-model="formData.prologue"
            type="textarea"
            placeholder="请输入开场白（选填）"
            :rows="3"
            autosize
            maxlength="500"
            show-word-limit
            :border="false"
            @change="(e) => onTextareaChange(e, 'prologue')"
          />
        </div>
      </div>

      <!-- 开场角色 -->
      <div class="form-section" v-if="selectedCharacters.length">
        <div class="section-title">
          <span>开场角色</span>
          <span class="section-tip">选择第一个发言的角色</span>
        </div>
        <div class="prologue-characters">
          <div 
            v-for="char in selectedCharacters" 
            :key="char.id"
            class="prologue-char"
            :class="{ active: formData.prologueCharacterId == char.id }"
            @click="onSelectPrologueCharacter(char.id)"
          >
            <img class="prologue-avatar" :src="char.avatarUrl" alt="">
            <div class="prologue-name">{{ char.name }}</div>
          </div>
        </div>
      </div>

      <!-- 我的设定 -->
      <div class="form-section">
        <div class="section-title">我的设定</div>
        <div class="setting-item" @click="onUserSettings">
          <div class="setting-content">
            <div class="setting-label">设定我的身份</div>
            <div class="setting-value" v-if="formData.userAddressedAs || formData.identity">
              <span v-if="formData.userAddressedAs">{{ formData.userAddressedAs }}</span>
              <span v-if="formData.identity"> · {{ formData.identity }}</span>
            </div>
            <div class="setting-placeholder" v-else>点击设置</div>
          </div>
          <van-icon name="arrow" color="rgba(255,255,255,0.4)" />
        </div>
      </div>

      <!-- 聊天背景 -->
      <div class="form-section">
        <div class="section-title">聊天背景</div>
        <div class="bg-uploader" @click="onChatBackground">
          <div v-if="currentBg" class="bg-preview">
            <img :src="currentBg" alt="" class="bg-image">
            <div class="bg-mask">
              <van-icon name="photograph" size="48rpx" />
            </div>
          </div>
          <div v-else class="bg-placeholder">
            <van-icon name="photograph" size="48rpx" />
            <span>点击设置背景</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <van-button 
        type="primary" 
        block 
        round
        :loading="submitting"
        @click="onSubmit"
      >
        {{ submitBtnText }}
      </van-button>
    </div>

    <!-- 上传组件 -->
    <van-popup 
      :show="showUploader" 
      position="bottom" 
      round
      @close="showUploader = false"
    >
      <div class="upload-sheet">
        <div class="upload-title">上传背景</div>
        <van-uploader 
          :max-count="1"
          :preview-size="200"
          :after-read="onUploadRead"
          accept="image"
        />
      </div>
    </van-popup>

    <TipDialog ref="tipDialogRef" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'
import { verifyUrls } from '@/api/file'
import { createGroupChat, updateGroupChat } from '@/services/ai/group-chat'
import { getCurrentPlotByGroupChatId } from '@/api/group'
import { createPlot, updatePlot } from '@/api/ai/chat'
import { getGroupDetail } from '@/api/group'

const route = useRoute()
const router = useRouter()

const tipDialogRef = ref(null)

const isEdit = ref(false)
const pageTitle = ref('创建群聊')
const submitBtnText = ref('保存设定')
const submitting = ref(false)
const showUploader = ref(false)
const currentBg = ref('')

const selectedCharacters = ref([])

const formData = reactive({
  id: null,
  storyId: null,
  plotId: null,
  name: '',
  description: '',
  storyTitle: '',
  title: '',
  scene: '',
  plotSetting: '',
  prologue: '',
  prologueCharacterId: '',
  userAddressedAs: '',
  identity: '',
  personaGender: '',
  backgroundImage: null
})

onMounted(() => {
  // 存储上一页引用
  window.__prevPage = router.currentRoute.value.meta?.prevPage
  
  if (route.query.id) {
    isEdit.value = true
    pageTitle.value = '编辑群聊'
    submitBtnText.value = '保存修改'
    formData.id = route.query.id
    formData.plotId = route.query.plotId || null
    loadGroupForEdit(route.query.id, route.query.plotId || null)
  }
})

async function loadGroupForEdit(groupId, plotId) {
  try {
    const res = await getGroupDetail(groupId, plotId)
    if (!res) return

    const characters = (res.characterInfos || []).map(c => ({
      id: c.id,
      name: c.name,
      avatarUrl: c.avatar || c.avatarUrl || ''
    }))

    const story = (res.plotDetailVO && res.plotDetailVO.story) || res.defaultStoryDetail || {}
    const persona = (res.plotDetailVO && res.plotDetailVO.persona) || res.defaultPersona || {}
    const backgroundImage = (res.plotDetailVO && res.plotDetailVO.backgroundImage) || res.backgroundImage || ''

    selectedCharacters.value = characters
    currentBg.value = backgroundImage
    
    Object.assign(formData, {
      id: groupId,
      storyId: story.id || null,
      plotId: res.currentPlotId || plotId || null,
      name: res.name || '',
      description: res.description || '',
      storyTitle: story.title || '',
      title: story.title || '',
      scene: story.scene || '',
      prologue: story.prologue || '',
      prologueCharacterId: story.prologueCharacterId || '',
      userAddressedAs: persona.userAddressedAs || '',
      identity: persona.identity || '',
      personaGender: persona.gender || '',
      backgroundImage
    })
  } catch (err) {
    console.error('加载群聊详情失败:', err)
  }
}

function backAction() {
  const content = isEdit.value
    ? '退出当前页面后，修改的内容不会被保存，确认退出？'
    : '退出当前页面后，编辑的内容不会被保存，确认退出？'
  
  tipDialogRef.value?.show({
    title: '提示',
    content,
    cancelText: '取消',
    confirmText: '确认',
    onConfirm: () => {
      router.back()
    }
  })
}

function onInputChange(e, field) {
  formData[field] = e.detail || e
}

function onTextareaChange(e, field) {
  formData[field] = e.detail || e
}

function onSelectPrologueCharacter(id) {
  formData.prologueCharacterId = formData.prologueCharacterId == id ? null : id
}

function onRemoveCharacter(id) {
  const index = selectedCharacters.value.findIndex(c => c.id == id)
  if (index !== -1) {
    selectedCharacters.value.splice(index, 1)
  }
}

function onAddCharacters() {
  // 跳转到角色选择页面
  const selectedRoles = encodeURIComponent(JSON.stringify(selectedCharacters.value))
  router.push({
    path: '/group/role-select',
    query: { selectedRoles }
  })
}

function onUserSettings() {
  router.push({
    path: '/role/my-setting',
    query: {
      gender: formData.personaGender,
      userAddressedAs: formData.userAddressedAs,
      identity: formData.identity
    }
  })
}

function confirmUserSettings(data) {
  formData.userAddressedAs = data.userAddressedAs
  formData.identity = data.identity
  formData.personaGender = data.personaGender
}

function onChatBackground() {
  showUploader.value = true
}

async function onUploadRead(file) {
  try {
    const res = await verifyUrls([file.file.fileKey || file.fileKey])
    const fileRes = res && res[0] ? res[0] : {}
    
    if (fileRes && !fileRes.illegal) {
      currentBg.value = file.content || file.url
      formData.backgroundImage = file.content || file.url
    } else {
      showToast({ message: '您上传的图片包含敏感信息', icon: 'none' })
    }
    showUploader.value = false
  } catch (err) {
    showToast({ message: '上传失败', icon: 'none' })
    showUploader.value = false
  }
}

async function onSubmit() {
  if (!formData.name) {
    showToast({ message: '请输入群名称', icon: 'none' })
    return
  }
  if (!formData.description) {
    showToast({ message: '请输入群简介', icon: 'none' })
    return
  }
  if (!selectedCharacters.value || selectedCharacters.value.length < 2) {
    showToast({ message: '请选择至少2个角色', icon: 'none' })
    return
  }
  if (!formData.storyTitle) {
    showToast({ message: '请输入故事名称', icon: 'none' })
    return
  }
  if (!formData.scene) {
    showToast({ message: '请输入故事设定', icon: 'none' })
    return
  }

  showLoadingToast({ message: '保存中...', forbidClick: true })
  submitting.value = true

  try {
    const params = {
      groupChatId: formData.id || undefined,
      name: formData.name,
      description: formData.description,
      characterIds: selectedCharacters.value.map(c => c.id),
      defaultBackgroundImage: formData.backgroundImage || '',
      prologue: formData.prologue,
      storyTitle: formData.storyTitle,
      title: formData.storyTitle,
      scene: formData.scene,
      prologueCharacterId: formData.prologueCharacterId || undefined
    }

    let method = createGroupChat
    if (isEdit.value) {
      method = updateGroupChat
    }

    const res = await method(params)
    closeToast()

    // 编辑模式：同步开场白角色到 plot
    const onAfterChatSuccess = async () => {
      try {
        let plotId = formData.plotId
        if (!plotId) {
          const cur = await getCurrentPlotByGroupChatId(res.groupChatId || formData.id)
          plotId = cur && cur.plotId
        }
        if (plotId && formData.prologueCharacterId) {
          await updatePlot({
            id: plotId,
            prologueCharacterId: formData.prologueCharacterId
          })
        }
      } catch (e) {
        console.error('更新开场白角色失败:', e)
      }

      router.replace({
        path: '/chat',
        query: { 
          plotId: formData.plotId || '',
          groupId: res.groupChatId || formData.id
        }
      })
    }

    const onAfterCreatePlot = async () => {
      const plotRes = await createPlot({
        groupChatId: res.groupChatId,
        storyId: res.defaultStoryId,
      })
      router.replace({
        path: '/chat',
        query: { 
          plotId: plotRes || '',
          groupId: res.groupChatId
        }
      })
    }

    tipDialogRef.value?.show({
      title: `${isEdit.value ? '更新成功' : '创建成功'}`,
      content: '有任何问题，可添加客服微信咨询。',
      cancelText: '添加客服',
      confirmText: '去聊天',
      onCancel: () => {
        // 可以打开客服
      },
      onConfirm: isEdit.value ? onAfterChatSuccess : onAfterCreatePlot
    })
  } catch (err) {
    closeToast()
    console.error(`${isEdit.value ? '更新' : '创建'}群聊失败:`, err)
    showToast({ message: `${isEdit.value ? '更新' : '创建'}失败`, icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// 暴露方法给路由
defineExpose({
  onRoleSelectBack(selectedRoles) {
    selectedCharacters.value = selectedRoles || []
  },
  confirmUserSettings
})
</script>

<style lang="scss" scoped>
.group-add-page {
  min-height: 100vh;
  background: #1a1a1a;
  padding-bottom: 200rpx;
}

.page-content {
  padding-top: 88px;
  padding: 88px 24rpx 0;
}

.form-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 24rpx;
}

.section-tip {
  font-size: 24rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
}

.form-item {
  padding: 16rpx 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12rpx;
}

.character-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.character-item {
  position: relative;
  width: 120rpx;
  text-align: center;
  
  .character-avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    border: 4rpx solid #FF5F15;
  }
  
  .character-name {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .character-remove {
    position: absolute;
    top: -8rpx;
    right: 8rpx;
    width: 36rpx;
    height: 36rpx;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
}

.character-add {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx dashed rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.prologue-characters {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.prologue-char {
  text-align: center;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  
  &.active {
    opacity: 1;
    
    .prologue-avatar {
      border-color: #FF5F15;
      box-shadow: 0 0 20rpx rgba(255, 95, 21, 0.5);
    }
    
    .prologue-name {
      color: #FF5F15;
    }
  }
  
  .prologue-avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    border: 4rpx solid transparent;
    transition: all 0.2s;
  }
  
  .prologue-name {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 8rpx;
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  cursor: pointer;
}

.setting-content {
  flex: 1;
}

.setting-label {
  font-size: 28rpx;
  color: #fff;
}

.setting-value {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8rpx;
}

.setting-placeholder {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8rpx;
}

.bg-uploader {
  cursor: pointer;
}

.bg-preview {
  position: relative;
  width: 100%;
  height: 300rpx;
  border-radius: 16rpx;
  overflow: hidden;
  
  .bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .bg-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
}

.bg-placeholder {
  height: 200rpx;
  border: 2rpx dashed rgba(255, 255, 255, 0.3);
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  color: rgba(255, 255, 255, 0.5);
  font-size: 24rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + var(--safearea-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 50;
  
  .van-button {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    border: none;
  }
}

.upload-sheet {
  padding: 32rpx;
  
  .upload-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
    text-align: center;
    margin-bottom: 32rpx;
  }
}
</style>
