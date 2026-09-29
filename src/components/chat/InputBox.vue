<template>
  <div class="input-box-wrapper" :class="{ disabled }">
    <!-- 底部工具栏 -->
    <div v-if="showBoard" class="tool-bar">
      <div class="tool-bar-inner">
        <!-- 灵感按钮 -->
        <div class="tool-item" @click="onInspiration">
          <span class="tool-icon">💡</span>
          <span class="tool-label">灵感</span>
        </div>
        
        <!-- 新剧情按钮 -->
        <div class="tool-item" @click="onRestart">
          <span class="tool-icon">🔄</span>
          <span class="tool-label">新剧情</span>
        </div>
        
        <!-- 剧情列表按钮 -->
        <div class="tool-item" @click="onPlotList">
          <span class="tool-icon">📜</span>
          <span class="tool-label">剧情</span>
        </div>
        
        <!-- 上传图片按钮 -->
        <div class="tool-item" @click="onUploadImage">
          <span class="tool-icon">📷</span>
          <span class="tool-label">图片</span>
        </div>
      </div>
    </div>

    <!-- 灵感推荐面板 -->
    <div v-if="showInspiration" class="inspiration-panel">
      <div class="inspiration-header">
        <span class="inspiration-title">灵感推荐</span>
        <span class="inspiration-refresh" @click="onRefreshInspiration">🔄 换一批</span>
      </div>
      
      <div v-if="inspirationLoading" class="inspiration-loading">
        <van-loading size="24px">加载中...</van-loading>
      </div>
      
      <div v-else-if="inspirationEmpty" class="inspiration-empty">
        <span>暂无灵感</span>
      </div>
      
      <div v-else class="inspiration-list">
        <div
          v-for="(item, idx) in inspirationList"
          :key="idx"
          class="inspiration-item"
          @click="onInspirationTap(item)"
        >
          {{ item }}
        </div>
      </div>
    </div>

    <!-- 主输入区域 -->
    <div class="input-area" :class="{ 'with-keyboard': keyboardHeight > 0 }">
      <!-- 工具栏切换按钮 -->
      <!-- <div class="tool-toggle" @click="toggleBoard">
        <span>{{ showBoard ? '📤' : '📎' }}</span>
      </div> -->

      <!-- 文本输入框 -->
      <div class="input-wrap">
        <van-field
          v-model="inputValue"
          type="textarea"
          :placeholder="placeholder"
          :disabled="disabled"
          :maxlength="2000"
          autosize
          rows="1"
          @blur="onBlur"
          @focus="onFocus"
          @input="onInput"
          @click="onInputClick"
        />
      </div>

      <!-- 发送按钮 -->
      <div class="send-btn" :class="{ active: canSend }" @click="onSend">
        <span>发送</span>
      </div>
    </div>

    <!-- 图片上传预览 -->
    <div v-if="imageList.length > 0" class="image-preview-bar">
      <div v-for="(img, idx) in imageList" :key="idx" class="preview-item">
        <img :src="img.localUrl" class="preview-img" />
        <span class="preview-remove" @click="removeImage(idx)">×</span>
      </div>
    </div>

    <!-- 图片上传组件 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="onFileChange"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  plotInfo: {
    type: Object,
    default: () => ({})
  },
  roleInfo: {
    type: Object,
    default: () => ({})
  },
  groupInfo: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '输入消息...'
  }
})

const emit = defineEmits([
  'sendMessage',
  'keyboardHeightChange',
  'inputLineChange',
  'hideTabbar',
  'showTabbar',
  'buttonClick'
])

const inputValue = ref('')
const keyboardHeight = ref(0)
const showBoard = ref(false)
const showInspiration = ref(false)
const inspirationLoading = ref(false)
const inspirationEmpty = ref(false)
const inspirationList = ref([])
const imageList = ref([])
const fileInput = ref(null)

const canSend = computed(() => {
  return (inputValue.value.trim() || imageList.value.length > 0) && !props.disabled
})

// 切换工具栏
function toggleBoard() {
  showBoard.value = !showBoard.value
  if (showBoard.value) {
    showInspiration.value = false
    emit('hideTabbar')
  } else {
    emit('showTabbar')
  }
}

// 输入框聚焦
function onFocus(e) {
  showBoard.value = false
  showInspiration.value = false
  emit('showTabbar')
}

// 输入框失焦
function onBlur() {
  emit('keyboardHeightChange', 0)
}

// 输入事件
function onInput() {
  emit('inputLineChange')
}

// 输入框点击
function onInputClick() {
  // 输入时收起工具栏
}

// 发送消息
function onSend() {
  if (!canSend.value) return
  
  emit('sendMessage', {
    content: inputValue.value.trim(),
    imageList: imageList.value
  })
  
  // 清空输入
  inputValue.value = ''
  imageList.value = []
}

// 灵感推荐
function onInspiration() {
  showInspiration.value = !showInspiration.value
  if (showInspiration.value) {
    loadInspiration()
    emit('hideTabbar')
  } else {
    emit('showTabbar')
  }
}

// 刷新灵感
function onRefreshInspiration() {
  loadInspiration()
}

// 加载灵感
async function loadInspiration() {
  inspirationLoading.value = true
  inspirationEmpty.value = false
  
  try {
    const { inspirationReply } = await import('@/api/ai/chat')
    const res = await inspirationReply({
      plotId: props.plotInfo.id,
      groupId: props.groupInfo.id,
      characterId: props.roleInfo.id
    })
    
    if (res) {
      const list = typeof res === 'string' ? JSON.parse(res) : res
      inspirationList.value = list || []
      inspirationEmpty.value = !list || list.length === 0
    } else {
      inspirationEmpty.value = true
    }
  } catch (e) {
    console.error('加载灵感失败', e)
    inspirationEmpty.value = true
  } finally {
    inspirationLoading.value = false
  }
}

// 点击灵感
function onInspirationTap(item) {
  inputValue.value = item
  showInspiration.value = false
  emit('showTabbar')
}

// 新剧情
function onRestart() {
  showBoard.value = false
  showInspiration.value = false
  emit('showTabbar')
  emit('buttonClick', { action: 'restart' })
}

// 剧情列表
function onPlotList() {
  showBoard.value = false
  showInspiration.value = false
  emit('showTabbar')
  emit('buttonClick', { action: 'changePlot' })
}

// 上传图片
function onUploadImage() {
  fileInput.value?.click()
}

// 文件选择
async function onFileChange(e) {
  const files = e.target.files
  if (!files || files.length === 0) return
  
  for (const file of files) {
    if (imageList.value.length >= 9) break // 最多9张
    
    // 创建本地预览
    const localUrl = URL.createObjectURL(file)
    
    // 上传到服务器
    try {
      const { uploadImage } = await import('@/api/file')
      const res = await uploadImage(file)
      imageList.value.push({
        localUrl,
        fileKey: res.fileKey
      })
    } catch (e) {
      console.error('上传图片失败', e)
      URL.revokeObjectURL(localUrl)
    }
  }
  
  // 清空 input 以支持重复选择同一张图
  e.target.value = ''
}

// 移除图片
function removeImage(idx) {
  const img = imageList.value[idx]
  if (img?.localUrl) {
    URL.revokeObjectURL(img.localUrl)
  }
  imageList.value.splice(idx, 1)
}
</script>

<style lang="scss" scoped>
.input-box-wrapper {

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.tool-bar {
  padding: 16rpx 32rpx;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.tool-bar-inner {
  display: flex;
  gap: 32rpx;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  transition: background 0.2s;

  &:active {
    background: #f0f0f0;
  }
}

.tool-icon {
  font-size: 40rpx;
}

.tool-label {
  font-size: 22rpx;
  color: #666;
}

.inspiration-panel {
  padding: 24rpx 32rpx;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  max-height: 400rpx;
  overflow-y: auto;
}

.inspiration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.inspiration-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.inspiration-refresh {
  font-size: 24rpx;
  color: #FF5F15;
  cursor: pointer;
}

.inspiration-loading,
.inspiration-empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}

.inspiration-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.inspiration-item {
  padding: 20rpx 24rpx;
  background: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    background: #f0f0f0;
    transform: scale(0.98);
  }
}

.input-area {
  display: flex;
  align-items: flex-end;
  padding: 16rpx 24rpx;
  gap: 16rpx;
  min-height: 100rpx;

  &.with-keyboard {
    padding-bottom: 0;
  }
}

.tool-toggle {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  flex-shrink: 0;
  cursor: pointer;

  &:active {
    opacity: 0.7;
  }
}

.input-wrap {
  flex: 1;
  min-width: 0;

  :deep(.van-field) {
    padding: 6rpx 8rpx;
    background: rgba(100, 100, 100, 0.2);
    backdrop-filter: blur(3.8px);
    -webkit-backdrop-filter: blur(3.8px);
    border-radius: 36rpx;

    .van-field__control {
      font-size: 16rpx;
      line-height: 1.5;
    }

    .van-field__word-limit {
      font-size: 14rpx;
    }
  }
}

.send-btn {
  width: 60rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ccc;
  border-radius: 20rpx;
  font-size: 14rpx;
  color: #fff;
  font-weight: 500;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
  }

  &:active {
    transform: scale(0.95);
  }
}

.image-preview-bar {
  display: flex;
  gap: 16rpx;
  padding: 0 24rpx 16rpx;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.preview-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
}

.preview-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
  object-fit: cover;
}

.preview-remove {
  position: absolute;
  top: -16rpx;
  right: -16rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  color: #fff;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
