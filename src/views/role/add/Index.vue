<template>
  <div class="role-add-page">
    <!-- 背景图 -->
    <div 
      v-if="currentBg" 
      class="page-bg" 
      :style="{ backgroundImage: `url(${currentBg})` }"
    ></div>

    <!-- 可滚动内容区域 -->
    <div class="scroll-content">
      <!-- 表单内容 -->
      <div class="form-content">
        <!-- 头像上传 -->
        <div class="avatar-section">
          <div v-if="!currentBg" class="bg-empty" @click="onChatBackground">
            <div class="bg-empty-icon">+</div>
            <span>创建智能体专属形象</span>
          </div>
          <div v-else class="edit-avatar" @click="onChatBackground">
            <img :src="currentBg" class="avatar-image" />
            <span class="avatar-edit-tip">点击可修改形象</span>
            <van-icon name="edit" class="avatar-edit-icon" />
          </div>
        </div>

        <!-- 智能体人设 -->
        <div class="form-section">
          <div class="section-title">智能体人设</div>

          <!-- 名称 -->
          <div class="form-item form-item-row">
            <div class="form-label">
              <span class="label-required">*</span>
              <span>名称</span>
            </div>
            <van-field
              v-model="formData.name"
              placeholder="请输入"
              :maxlength="20"
              input-align="right"
              @update:model-value="(v) => formData.name = v"
            />
          </div>

          <!-- 性别 -->
          <div class="form-item form-item-row" @click="onSelectGender">
            <div class="form-label">
              <span class="label-required">*</span>
              <span>性别</span>
            </div>
            <div class="form-select">
              <span :class="formData.gender ? 'select-text' : 'select-placeholder'">
                {{ formData.gender || '请选择（不可更改）' }}
              </span>
              <van-icon name="arrow" />
            </div>
          </div>

          <!-- 智能体设定 -->
          <div class="form-item textarea-item">
            <div class="form-label">
              <span class="label-required">*</span>
              <span>智能体设定</span>
              <span v-if="formData.descriptionPrompt" class="auto-generate" @click="autoGenerate">一键生成</span>
            </div>
            <div class="textarea-counter">{{ formData.descriptionPrompt?.length || 0 }}/10000</div>
            <div class="label-placeholder">决定智能体的对话效果，且仅创作者可见，不会对外展示。</div>
            <van-field
              v-model="formData.descriptionPrompt"
              type="textarea"
              placeholder="填写智能体的信息，包含但不限于智能体的人设、性格、身份、背景、经历、与用户的关系等。"
              :maxlength="10000"
              :rows="4"
              autosize
              @update:model-value="(v) => formData.descriptionPrompt = v"
            />
          </div>

          <!-- 角色描述 -->
          <div class="form-item textarea-item">
            <div class="form-label">
              <span class="label-required">*</span>
              <span>角色描述</span>
            </div>
            <div class="textarea-counter">{{ formData.description?.length || 0 }}/10000</div>
            <div class="label-placeholder">不影响对话效果，仅用于用户快速了解智能体，会对外展示。</div>
            <van-field
              v-model="formData.description"
              type="textarea"
              placeholder="主要包含但不限于智能体的人设、性格、身份、背景、经历、聊天风格、与用户的关系等。"
              :maxlength="10000"
              :rows="4"
              autosize
              @update:model-value="(v) => formData.description = v"
            />
          </div>
        </div>

        <!-- 故事剧情设定 -->
        <div class="form-section">
          <div class="section-title">故事剧情设定</div>

          <!-- 剧情介绍 -->
          <div class="form-item textarea-item">
            <div class="form-label">
              <span>剧情介绍</span>
            </div>
            <div class="textarea-counter">{{ formData.scene?.length || 0 }}/10000</div>
            <div class="label-placeholder">不影响对话效果，仅用于用户快速了解智能体，会对外展示。</div>
            <van-field
              v-model="formData.scene"
              type="textarea"
              placeholder="用于了解智能体的基本信息、如背景、身份、当前对话场景等。"
              :maxlength="10000"
              :rows="3"
              autosize
              @update:model-value="(v) => formData.scene = v"
            />
          </div>

          <!-- 开场白 -->
          <div class="form-item textarea-item">
            <div class="form-label">
              <span class="label-required">*</span>
              <span>开场白</span>
            </div>
            <div class="textarea-counter">{{ formData.prologue?.length || 0 }}/10000</div>
            <div class="label-placeholder">决定智能体的效果，引起用户的对话兴趣。</div>
            <van-field
              v-model="formData.prologue"
              type="textarea"
              placeholder="与用户开启聊天的第一句话。"
              :maxlength="10000"
              :rows="3"
              autosize
              @update:model-value="(v) => formData.prologue = v"
            />
          </div>
        </div>

        <!-- 高级设定 -->
        <div v-if="!showAdvancedSetting" class="advanced-setting-container" @click="showAdvancedSetting = true">
          <div class="advanced-setting">
            高级设定
            <van-icon name="arrow-down" />
          </div>
        </div>

        <div v-else class="form-section">
          <div class="section-title">高级设定</div>

          <!-- 智能体类型 -->
          <div class="advanced-meta-block">
            <div class="meta-header">
              <div class="meta-title">智能体类型</div>
            </div>
            <div class="meta-desc">不影响对话效果，仅用于用户快速了解该智能体。</div>
            <div class="meta-options">
              <div
                v-for="option in typeOptions"
                :key="option.id"
                class="meta-option"
                :class="{ 'meta-option-selected': formData.typeIds.includes(option.id) }"
                @click="onToggleType(option.id)"
              >
                {{ option.name }}
              </div>
            </div>
          </div>

          <!-- 智能体标签 -->
          <div class="advanced-meta-block">
            <div class="meta-header meta-header-row">
              <div class="meta-title">智能体标签</div>
              <div class="meta-count">{{ formData.tagIds?.length || 0 }}/{{ maxTagSelect }}</div>
            </div>
            <div class="meta-desc">不影响对话效果，仅用于用户快速了解该智能体。</div>
            <div class="tag-chips">
              <div
                v-for="tag in selectedTagList"
                :key="tag.id"
                class="tag-chip"
                @click="onRemoveSelectedTag(tag.id)"
              >
                <span class="tag-chip-text">{{ tag.name }}</span>
                <van-icon name="close" class="tag-chip-close" />
              </div>
              <div class="tag-add" @click="showTagSelector = true">
                <span class="tag-add-plus">+</span>
                添加标签
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 固定底部提交按钮 -->
    <div class="submit-footer">
      <div class="submit-btn" @click="onSubmit">
        {{ formData.id ? '保存' : '创建智能体' }}
        <div v-if="formData.id" class="edit-tip">对智能体编辑成功后，将影响后续的对话内容哦。</div>
      </div>
    </div>

    <!-- 标签选择弹窗 -->
    <van-popup
      v-model:show="showTagSelector"
      position="bottom"
      round
      class="tag-selector-popup"
    >
      <div class="tag-selector-panel">
        <div class="tag-selector-header">
          <span class="tag-selector-title">选择标签</span>
          <van-icon name="close" @click="showTagSelector = false" />
        </div>
        <div class="tag-selector-body">
          <div class="tag-selector-sub">最多选择 {{ maxTagSelect }} 个</div>
          <div class="meta-options">
            <div
              v-for="option in tagSelectorOptions"
              :key="option.id"
              class="meta-option"
              :class="{ 'meta-option-selected': tempTagIds.includes(option.id) }"
              @click="onToggleTagInSelector(option.id)"
            >
              {{ option.name }}
            </div>
          </div>
        </div>
        <div class="tag-selector-footer">
          <div class="btn-cancel" @click="showTagSelector = false">取消</div>
          <div class="btn-confirm" @click="onConfirmTagSelector">确定</div>
        </div>
      </div>
    </van-popup>

    <!-- 图片上传 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="onFileChange"
    />

    <CustomNav title="" :show-back="true" :transparent="true" />
    <TipDialog ref="tipDialogRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'
import { createCharacter, updateCharacter, getCharacterDetail, getCharacterType, getCharacterTag, generateDescription } from '@/api/role'
import { verifyUrls } from '@/api/file'
import { uploadImage } from '@/api/file'

const route = useRoute()
const router = useRouter()

const fileInput = ref(null)
const tipDialogRef = ref(null)

// 状态
const formData = ref({
  id: null,
  name: '',
  gender: '',
  description: '',
  descriptionPrompt: '',
  scene: '',
  prologue: '',
  typeIds: [],
  tagIds: [],
  backgroundImage: '',
  defaultBackgroundImage: ''
})

const currentBg = ref('')
const showAdvancedSetting = ref(false)
const showTagSelector = ref(false)
const typeOptions = ref([])
const tagOptions = ref([])
const selectedTagList = ref([])
const tempTagIds = ref([])
const tagSelectorOptions = ref([])
const maxTagSelect = 4

const genderList = ['男', '女', '其他']

// 生命周期
onMounted(() => {
  const { id } = route.query
  if (id) {
    formData.value.id = id
    loadCharacter(id)
  }
  loadMetaOptions()
})

// 加载角色详情
async function loadCharacter(id) {
  try {
    const res = await getCharacterDetail(id)
    formData.value = {
      ...formData.value,
      ...res,
      name: res.name || '',
      gender: res.defaultPersona?.gender || '',
      description: res.description || '',
      descriptionPrompt: res.descriptionPrompt || '',
      scene: res.defaultStoryDetail?.scene || '',
      prologue: res.defaultStoryDetail?.prologue || '',
      typeIds: res.typeIds || [],
      tagIds: res.tagIds || []
    }
    currentBg.value = res.backgroundImage || ''
    syncSelectedMeta()
  } catch (e) {
    console.error('加载角色失败', e)
  }
}

// 加载元数据选项
async function loadMetaOptions() {
  try {
    const [types, tags] = await Promise.all([getCharacterType(), getCharacterTag()])
    typeOptions.value = (types || []).filter(t => t.name !== '推荐')
    tagOptions.value = tags || []
    syncSelectedMeta()
  } catch (e) {
    console.error('加载选项失败', e)
  }
}

// 同步选中状态
function syncSelectedMeta() {
  selectedTagList.value = tagOptions.value.filter(t => formData.value.tagIds?.includes(t.id))
  tagSelectorOptions.value = tagOptions.value.map(t => ({
    ...t,
    selected: formData.value.tagIds?.includes(t.id)
  }))
}

// 切换类型
function onToggleType(id) {
  formData.value.typeIds = [id]
}

// 选择性别
function onSelectGender() {
  showConfirmDialog({
    title: '选择性别',
    message: '',
    confirmButtonColor: '#FF5F15'
  }).then(() => {}).catch(() => {})
  
  // 简单实现：循环选择
  const currentIdx = genderList.indexOf(formData.value.gender)
  const nextIdx = (currentIdx + 1) % genderList.length
  formData.value.gender = genderList[nextIdx]
}

// 打开标签选择
function onOpenTagSelector() {
  tempTagIds.value = [...(formData.value.tagIds || [])]
  tagSelectorOptions.value = tagOptions.value.map(t => ({
    ...t,
    selected: tempTagIds.value.includes(t.id)
  }))
  showTagSelector.value = true
}

// 切换标签
function onToggleTagInSelector(id) {
  const idx = tempTagIds.value.indexOf(id)
  if (idx !== -1) {
    tempTagIds.value.splice(idx, 1)
  } else if (tempTagIds.value.length < maxTagSelect) {
    tempTagIds.value.push(id)
  } else {
    showToast({ message: `最多选择${maxTagSelect}个标签`, icon: 'none' })
    return
  }
  tagSelectorOptions.value = tagSelectorOptions.value.map(t => ({
    ...t,
    selected: tempTagIds.value.includes(t.id)
  }))
}

// 确认标签选择
function onConfirmTagSelector() {
  formData.value.tagIds = [...tempTagIds.value]
  syncSelectedMeta()
  showTagSelector.value = false
}

// 移除已选标签
function onRemoveSelectedTag(id) {
  formData.value.tagIds = formData.value.tagIds.filter(tid => tid !== id)
  syncSelectedMeta()
}

// 一键生成描述
async function autoGenerate() {
  if (!formData.value.descriptionPrompt) {
    showToast({ message: '请先补充智能体设定', icon: 'none' })
    return
  }
  
  showLoadingToast({ message: '生成中...', forbidClick: true })
  try {
    const res = await generateDescription({ characterSetting: formData.value.descriptionPrompt })
    formData.value.description = res || ''
    closeToast()
  } catch (e) {
    closeToast()
    showToast({ message: '生成失败', icon: 'none' })
  }
}

// 上传背景图
function onChatBackground() {
  fileInput.value?.click()
}

// 文件选择
async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  
  showLoadingToast({ message: '上传中...', forbidClick: true })
  try {
    const res = await uploadImage(file)
    const url = res?.uploadUrl?.split('?')[0] || ''
    
    // 验证图片
    const verifyRes = await verifyUrls([res.fileKey])
    if (verifyRes?.[0]?.illegal) {
      closeToast()
      showToast({ message: '图片包含敏感信息', icon: 'none' })
      return
    }
    
    currentBg.value = URL.createObjectURL(file)
    formData.value.backgroundImage = url
    formData.value.defaultBackgroundImage = url
    closeToast()
  } catch (e) {
    closeToast()
    showToast({ message: '上传失败', icon: 'none' })
  }
  
  e.target.value = ''
}

// 提交表单
async function onSubmit() {
  // 表单验证
  if (!formData.value.name) {
    showToast({ message: '请输入名称', icon: 'none' })
    return
  }
  if (!formData.value.gender) {
    showToast({ message: '请选择性别', icon: 'none' })
    return
  }
  if (!formData.value.descriptionPrompt) {
    showToast({ message: '请输入智能体设定', icon: 'none' })
    return
  }
  if (!formData.value.description) {
    showToast({ message: '请输入角色描述', icon: 'none' })
    return
  }
  if (!formData.value.prologue) {
    showToast({ message: '请输入开场白', icon: 'none' })
    return
  }

  const method = formData.value.id ? updateCharacter : createCharacter
  showLoadingToast({ message: `${method === updateCharacter ? '更新中' : '创建中'}...`, forbidClick: true })

  try {
    const result = await method({
      ...formData.value,
      description: formData.value.description || formData.value.descriptionPrompt
    })
    
    closeToast()
    showToast({ message: `${method === updateCharacter ? '更新成功' : '创建成功'}`, icon: 'success' })
    
    // 跳转到聊天页面
    const characterId = formData.value.id || result
    router.replace({
      path: '/pages/chat/index',
      query: { characterId }
    })
  } catch (e) {
    closeToast()
    showToast({ message: `${method === updateCharacter ? '更新失败' : '创建失败'}`, icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.role-add-page {
  min-height: 100vh;
  background: #1a1a1a;
  position: relative;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.scroll-content {
  position: relative;
  z-index: 1;
  padding-top: 88px;
  padding-bottom: 200px;
}

.form-content {
  padding: 24rpx;
}

.avatar-section {
  margin-bottom: 32rpx;
}

.bg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.1);
  }
}

.bg-empty-icon {
  font-size: 80rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16rpx;
}

.edit-avatar {
  position: relative;
  height: 300rpx;
  border-radius: 24rpx;
  overflow: hidden;
  cursor: pointer;

  &:active {
    opacity: 0.9;
  }
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-edit-tip {
  position: absolute;
  bottom: 24rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 26rpx;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
}

.avatar-edit-icon {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  font-size: 40rpx;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 12rpx;
  border-radius: 50%;
}

.form-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-item-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: #fff;
  min-width: 180rpx;
}

.label-required {
  color: #ff4d4f;
}

.form-select {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  font-size: 28rpx;
}

.select-placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.select-text {
  color: #fff;
}

.textarea-item {
  .form-label {
    margin-bottom: 16rpx;
  }
}

.textarea-counter {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
  margin-bottom: 8rpx;
}

.label-placeholder {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.auto-generate {
  margin-left: auto;
  font-size: 24rpx;
  color: #FF5F15;
  padding: 4rpx 16rpx;
  background: rgba(255, 95, 21, 0.2);
  border-radius: 16rpx;
}

.advanced-setting-container {
  padding: 24rpx;
  text-align: center;
}

.advanced-setting {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: #FFD700;
}

.advanced-meta-block {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.meta-header {
  margin-bottom: 16rpx;
}

.meta-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-title {
  font-size: 28rpx;
  color: #fff;
}

.meta-count {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.meta-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16rpx;
}

.meta-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.meta-option {
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 32rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:active {
    transform: scale(0.95);
  }

  &.meta-option-selected {
    background: rgba(255, 95, 21, 0.2);
    border-color: #FF5F15;
    color: #FF5F15;
  }
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-chip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 32rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.tag-chip-close {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.tag-add {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 32rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.tag-add-plus {
  font-size: 32rpx;
}

.submit-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + var(--safearea-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 50;
}

.submit-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
  }
}

.edit-tip {
  font-size: 22rpx;
  font-weight: normal;
  margin-top: 8rpx;
  opacity: 0.8;
}

.tag-selector-popup {
  background: #252525;
}

.tag-selector-panel {
  padding-bottom: var(--safearea-bottom);
}

.tag-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1px solid #333;
}

.tag-selector-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.tag-selector-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 24rpx 32rpx;
}

.tag-selector-sub {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 24rpx;
}

.tag-selector-footer {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  border-top: 1px solid #333;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  font-size: 28rpx;
  cursor: pointer;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-confirm {
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  color: #fff;
}
</style>
