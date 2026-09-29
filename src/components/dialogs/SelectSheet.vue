<template>
  <van-popup
    v-model:show="visible"
    round
    position="bottom"
    :close-on-click-overlay="true"
    class="select-sheet"
    @click-overlay="handleMaskClick"
  >
    <div class="sheet-content">
      <!-- 头部 -->
      <div class="sheet-header">
        <span class="close-btn" @click="handleClose">×</span>
        <span class="sheet-title">{{ title }}</span>
        <span class="placeholder"></span>
      </div>

      <!-- 普通模式 -->
      <div v-if="mode === 'normal'" class="sheet-body">
        <van-loading v-if="loading" class="loading-wrap" />
        
        <div v-else-if="list.length === 0" class="empty-wrap">
          <span>暂无数据</span>
        </div>

        <div v-else class="item-list">
          <div
            v-for="item in list"
            :key="item.id"
            class="list-item"
            @click="handleSelectItem(item)"
          >
            <div class="item-content">{{ item.content || item.title || item.name }}</div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <van-button size="small" :disabled="currentPage <= 1" @click="handlePrevPage">
            上一页
          </van-button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <van-button size="small" :disabled="currentPage >= totalPages" @click="handleNextPage">
            下一页
          </van-button>
        </div>
      </div>

      <!-- 重说模式 -->
      <div v-else-if="mode === 'retry'" class="sheet-body retry-mode">
        <van-loading v-if="loading" class="loading-wrap" />
        
        <div v-else-if="retryResults.length === 0" class="empty-wrap">
          <span>正在生成重说内容...</span>
        </div>

        <div v-else class="retry-content">
          <div class="retry-list">
            <div
              v-for="(result, idx) in retryResults"
              :key="idx"
              class="retry-item"
              :class="{ active: currentIndex === idx }"
              @click="currentIndex = idx"
            >
              <div class="retry-text">{{ result.content || '生成中...' }}</div>
              <div v-if="result.loading" class="retry-loading">
                <van-loading size="16px" />
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="retry-actions">
            <van-button 
              size="small" 
              :disabled="currentIndex <= 0" 
              @click="handlePrevResult"
            >
              ← 上一条
            </van-button>
            <span class="result-info">{{ currentIndex + 1 }} / {{ retryResults.length }}</span>
            <van-button 
              size="small" 
              :disabled="currentIndex >= 2 || currentIndex >= retryResults.length - 1" 
              @click="handleNextResult"
            >
              下一条 →
            </van-button>
          </div>

          <div class="use-btn-wrap">
            <van-button 
              type="primary" 
              block 
              :disabled="!canUse || loading"
              @click="handleUse"
            >
              使用该条
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { retellMessage, setCurrentMessage } from '@/api/ai/chat'

const visible = ref(false)
const mode = ref('normal') // 'normal' | 'retry'
const title = ref('选择')
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const list = ref([])
const messageId = ref('')
const plotId = ref('')
const retryResults = ref([])
const currentIndex = ref(0)
const canUse = computed(() => {
  const current = retryResults.value[currentIndex.value]
  return current && !current.loading && !!current.content
})

let _onSelect = null
let _onUse = null
let _onClose = null

function show(options = {}) {
  const {
    mode: m = 'normal',
    title: t = '选择',
    messageId: mid = '',
    plotId: pid = '',
    dataId = '',
    pageSize = 10,
    onSelect,
    onUse,
    onClose
  } = options

  _onSelect = onSelect
  _onUse = onUse
  _onClose = onClose

  mode.value = m
  title.value = t
  messageId.value = mid
  plotId.value = pid
  currentPage.value = 1
  retryResults.value = []
  currentIndex.value = 0

  visible.value = true

  if (m === 'retry') {
    // 重说模式：立即生成
    generateRetry()
  }
}

function hide() {
  visible.value = false
  _onSelect = null
  _onUse = null
  _onClose = null
}

function handleClose() {
  if (typeof _onClose === 'function') {
    _onClose()
  }
  hide()
}

function handleMaskClick() {
  handleClose()
}

function handleSelectItem(item) {
  if (typeof _onSelect === 'function') {
    _onSelect(item)
  }
  hide()
}

async function generateRetry() {
  if (retryResults.value.length >= 3) return

  loading.value = true
  canUse.value = false

  const newIndex = retryResults.value.length
  const newResult = {
    content: '',
    loading: true,
    messageId: ''
  }
  retryResults.value.push(newResult)
  currentIndex.value = newIndex

  try {
    await retellMessage(
      { messageId: messageId.value, plotId: plotId.value },
      (eventData) => {
        const { msg, type } = eventData.payload || {}
        const current = retryResults.value[newIndex]
        
        if (!current) return

        if (type === 'text') {
          current.content += msg || ''
        }

        if (type === 'aiMessageId') {
          current.messageId = msg
        }
        
        retryResults.value = [...retryResults.value]
      }
    )

    current.loading = false
    canUse.value = true
    retryResults.value = [...retryResults.value]
  } catch (e) {
    console.error('重说失败', e)
    retryResults.value.splice(newIndex, 1)
    currentIndex.value = Math.max(0, newIndex - 1)
  } finally {
    loading.value = false
  }
}

function handlePrevResult() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function handleNextResult() {
  const nextIndex = currentIndex.value + 1
  if (nextIndex < retryResults.value.length) {
    currentIndex.value = nextIndex
  } else if (retryResults.value.length < 3) {
    generateRetry()
  }
}

async function handleUse() {
  const current = retryResults.value[currentIndex.value]
  if (!current || !current.content) return

  try {
    await setCurrentMessage({
      messageId: messageId.value,
      content: current.content
    })
    
    if (typeof _onUse === 'function') {
      _onUse({
        originalMessageId: messageId.value,
        newContent: current.content,
        newMessageId: current.messageId
      })
    }
    
    hide()
  } catch (e) {
    console.error('替换失败', e)
  }
}

function handlePrevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    // TODO: 加载数据
  }
}

function handleNextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    // TODO: 加载数据
  }
}

defineExpose({ show, hide })
</script>

<style lang="scss" scoped>
.select-sheet {
  max-height: 70vh;
}

.sheet-content {
  padding-bottom: var(--safearea-bottom);
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1px solid #f0f0f0;
}

.close-btn {
  font-size: 48rpx;
  color: #999;
  padding: 0 16rpx;
}

.sheet-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.placeholder {
  width: 80rpx;
}

.sheet-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 32rpx;
}

.loading-wrap,
.empty-wrap {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.list-item {
  padding: 24rpx 32rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    background: #f0f0f0;
  }
}

.item-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  margin-top: 32rpx;
}

.page-info {
  font-size: 28rpx;
  color: #666;
}

.retry-mode {
  padding: 24rpx;
}

.retry-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.retry-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.retry-item {
  position: relative;
  padding: 24rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    border-color: #FF5F15;
    background: #fff5f0;
  }
}

.retry-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.retry-loading {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
}

.retry-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.result-info {
  font-size: 28rpx;
  color: #666;
  min-width: 100rpx;
  text-align: center;
}

.use-btn-wrap {
  margin-top: 16rpx;
}
</style>
