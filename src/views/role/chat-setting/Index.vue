<template>
  <div class="chat-setting-page">
    <CustomNav :title="pageTitle" :show-back="true" />
    
    <div class="page-content">
      <!-- 对话模型 -->
      <div class="setting-section">
        <div class="section-title">对话模型</div>
        <div class="setting-item" @click="onModelSelect">
          <div class="setting-label">
            <span>AI 模型</span>
            <span v-if="showModelDot" class="new-mark">new</span>
          </div>
          <div class="setting-value">
            <span>{{ currentModel?.name || '默认' }}</span>
            <van-icon name="arrow" />
          </div>
        </div>
      </div>

      <!-- 对话模式 -->
      <div class="setting-section">
        <div class="section-title">对话模式</div>
        
        <div class="setting-item switch-item">
          <div class="setting-label">
            <span>深度思考</span>
            <span class="setting-desc">让 AI 先思考再回复</span>
          </div>
          <van-switch
            v-model="ifReasoning"
            size="20px"
            active-color="#FF5F15"
            @change="onReasoningChange"
          />
        </div>

        <div class="setting-item switch-item">
          <div class="setting-label">
            <span>自动播放语音</span>
            <span class="setting-desc">收到回复后自动播放</span>
          </div>
          <van-switch
            v-model="autoPlayAudio"
            size="20px"
            active-color="#FF5F15"
            @change="onAutoPlayChange"
          />
        </div>

        <div class="setting-item switch-item">
          <div class="setting-label">
            <span>自动回复</span>
            <span v-if="showAutoReplyNew" class="new-mark">new</span>
            <span class="setting-desc">发送后自动触发 AI 回复</span>
          </div>
          <van-switch
            v-model="autoReply"
            size="20px"
            active-color="#FF5F15"
            @change="onAutoReplyChange"
          />
        </div>
      </div>

      <!-- 智能体记忆 -->
      <div class="setting-section">
        <div class="section-title">
          智能体记忆
          <van-icon name="info-o" class="info-icon" @click="onMemoryDesc" />
        </div>
        
        <div class="setting-item" @click="onMemoryStrength">
          <div class="setting-label">
            <span>记忆加强</span>
          </div>
          <div class="setting-value">
            <span class="memory-count">{{ plotInfo.memoryCount || 0 }} 条对话</span>
            <van-icon name="arrow" />
          </div>
        </div>
      </div>

      <!-- 聊天背景 -->
      <div class="setting-section">
        <div class="section-title">聊天背景</div>
        
        <div class="setting-item" @click="onSelectBackground">
          <div class="setting-label">
            <span>自定义背景</span>
          </div>
          <div class="setting-value">
            <van-icon name="arrow" />
          </div>
        </div>
      </div>
    </div>

    <!-- 模型选择 -->
    <ModelSheet ref="modelSheetRef" />
    <MemorySheet ref="memorySheetRef" />

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="onFileChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import ModelSheet from '@/components/dialogs/ModelSheet.vue'
import MemorySheet from '@/components/common/MemorySheet.vue'
import { getPlotDetail, updatePlot, getMemoryType } from '@/api/ai/chat'
import { getModelList, getGlobalModelId } from '@/api/usercenter'
import { verifyUrls } from '@/api/file'
import { uploadImage } from '@/api/file'

const route = useRoute()

const fileInput = ref(null)
const modelSheetRef = ref(null)
const memorySheetRef = ref(null)

const pageTitle = computed(() => {
  return route.query.roleName || route.query.groupChatName || '对话设定'
})

// 状态
const plotInfo = ref({
  id: null,
  memoryCount: 0,
  ifReasoning: false
})

const currentModel = ref(null)
const modelList = ref([])
const memoryOptions = ref([])
const showModelDot = ref(false)
const showAutoReplyNew = ref(false)
const autoPlayAudio = ref(false)
const autoReply = ref(true)

// 生命周期
onMounted(async () => {
  const { plotId } = route.query
  if (plotId) {
    plotInfo.value.id = plotId
    await Promise.all([
      loadPlotInfo(plotId),
      loadModelList(),
      loadMemoryOptions()
    ])
  }
  
  // 加载本地设置
  autoPlayAudio.value = localStorage.getItem('autoPlayAudio') === 'true'
  const autoReplyVal = localStorage.getItem('autoReply')
  autoReply.value = autoReplyVal !== '0'
  
  // 检查 new 标记
  if (!localStorage.getItem('newModelMark')) {
    showModelDot.value = true
    localStorage.setItem('newModelMark', 'true')
  }
  if (!localStorage.getItem('newAutoReplyMark')) {
    showAutoReplyNew.value = true
    localStorage.setItem('newAutoReplyMark', 'true')
  }
})

async function loadPlotInfo(plotId) {
  try {
    const res = await getPlotDetail(plotId)
    plotInfo.value = {
      ...plotInfo.value,
      ...res
    }
  } catch (e) {
    console.error('加载剧情信息失败', e)
  }
}

async function loadModelList() {
  try {
    const [list, globalId] = await Promise.all([getModelList(), getGlobalModelId()])
    modelList.value = list || []
    currentModel.value = list?.find(m => m.id === globalId) || null
  } catch (e) {
    console.error('加载模型列表失败', e)
  }
}

async function loadMemoryOptions() {
  try {
    const res = await getMemoryType()
    memoryOptions.value = res || []
  } catch (e) {
    console.error('加载记忆选项失败', e)
  }
}

// 模型选择
function onModelSelect() {
  showModelDot.value = false
  modelSheetRef.value?.show({
    modelOptions: modelList.value,
    currentValue: currentModel.value?.id,
    onConfirm: (id, item) => {
      currentModel.value = item
      showToast({ message: '切换成功', icon: 'success' })
    }
  })
}

// 深度思考切换
async function onReasoningChange(value) {
  try {
    await updatePlot({
      id: plotInfo.value.id,
      ifReasoning: value
    })
    plotInfo.value.ifReasoning = value
    showToast({ message: '保存成功', icon: 'success' })
  } catch (e) {
    plotInfo.value.ifReasoning = !value
    showToast({ message: '保存失败', icon: 'none' })
  }
}

// 自动播放语音
function onAutoPlayChange(value) {
  autoPlayAudio.value = value
  localStorage.setItem('autoPlayAudio', value ? 'true' : 'false')
  if (!localStorage.getItem('newAutoPlayAudioMark')) {
    localStorage.setItem('newAutoPlayAudioMark', 'true')
  }
}

// 自动回复
function onAutoReplyChange(value) {
  autoReply.value = value
  localStorage.setItem('autoReply', value ? '1' : '0')
  showAutoReplyNew.value = false
}

// 记忆说明
function onMemoryDesc() {
  showToast({ message: '记忆力越强，智能体对你的记忆越持久，但响应可能会变慢', icon: 'none' })
}

// 记忆加强
function onMemoryStrength() {
  if (!plotInfo.value.id) return
  memorySheetRef.value?.show({
    currentCount: plotInfo.value.memoryCount || 0,
    plotId: plotInfo.value.id,
    memoryOptions: memoryOptions.value,
    onConfirm: async (count) => {
      try {
        await updatePlot({
          id: plotInfo.value.id,
          memoryCount: count
        })
        plotInfo.value.memoryCount = count
        showToast({ message: '保存成功', icon: 'success' })
      } catch (e) {
        showToast({ message: '保存失败', icon: 'none' })
      }
    }
  })
}

// 选择背景
function onSelectBackground() {
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
    
    // 保存背景
    await updatePlot({
      id: plotInfo.value.id,
      backgroundImage: url
    })
    
    closeToast()
    showToast({ message: '设置成功', icon: 'success' })
  } catch (e) {
    closeToast()
    showToast({ message: '上传失败', icon: 'none' })
  }
  
  e.target.value = ''
}
</script>

<style lang="scss" scoped>
.chat-setting-page {
  min-height: 100vh;
  background: #1a1a1a;
}

.page-content {
  padding-top: 88px;
  padding-bottom: 24px;
}

.setting-section {
  padding: 0 24rpx 32rpx;
}

.section-title {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-icon {
  color: rgba(255, 255, 255, 0.6);
  font-size: 28rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  cursor: pointer;
  transition: all 0.2s;

  &:last-child {
    margin-bottom: 0;
  }

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
}

.switch-item {
  padding: 32rpx;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  font-size: 30rpx;
  color: #fff;
}

.setting-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
}

.memory-count {
  color: #FF5F15;
}

.new-mark {
  font-size: 20rpx;
  color: #fff;
  background: #FF5F15;
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
}
</style>
