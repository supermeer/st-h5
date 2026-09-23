<template>
  <div class="world-book-edit-page">
    <CustomNav title="编辑词条" :show-back="true" />

    <div class="page-content">
      <div class="form-section">
        <!-- 标题 -->
        <div class="form-item">
          <div class="form-label">标题</div>
          <van-field
            v-model="formData.title"
            placeholder="请输入标题"
            :border="false"
            @change="onTitleInput"
          />
        </div>

        <!-- 类型 -->
        <div class="form-item">
          <div class="form-label">类型</div>
          <div class="type-selector">
            <div 
              v-for="type in typeOptions" 
              :key="type.value"
              class="type-btn"
              :class="{ active: formData.msgType === type.value }"
              @click="onTypeSelect(type.value)"
            >
              {{ type.label }}
            </div>
          </div>
        </div>

        <!-- 内容 -->
        <div class="form-item">
          <div class="form-label">提示词</div>
          <van-field
            v-model="formData.content"
            type="textarea"
            placeholder="请输入提示词内容"
            :rows="8"
            autosize
            maxlength="2000"
            show-word-limit
            :border="false"
            @change="onContentInput"
          />
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <van-button 
        type="primary" 
        block 
        round
        :loading="saving"
        @click="onSave"
      >
        保存
      </van-button>
    </div>

    <van-toast id="van-toast" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'vant/lib/toast'
import CustomNav from '@/components/CustomNav.vue'

const route = useRoute()
const router = useRouter()

const saving = ref(false)
const mode = ref('add')
const currentBg = ref('')

const formData = reactive({
  title: '',
  msgType: 'system',
  content: ''
})

const typeOptions = [
  { label: '系统', value: 'system' },
  { label: 'AI', value: 'ai' },
  { label: '用户', value: 'user' }
]

onMounted(() => {
  // 存储上一页引用
  window.__prevPage = router.currentRoute.value.meta?.prevPage
  
  mode.value = route.query.mode || 'add'
  
  // 从 sessionStorage 获取数据
  const savedData = sessionStorage.getItem('worldBookData')
  if (savedData) {
    const data = JSON.parse(savedData)
    currentBg.value = data.background || ''
    
    // 如果是编辑模式，填充表单
    if (mode.value === 'edit' && data.editIndex !== undefined) {
      const editItem = data.worldBookList[data.editIndex]
      if (editItem) {
        formData.title = editItem.title || ''
        formData.msgType = editItem.msgType || 'system'
        formData.content = editItem.content || ''
      }
    }
  }
})

function onTitleInput(e) {
  formData.title = e.detail || e
}

function onTypeSelect(type) {
  formData.msgType = type
}

function onContentInput(e) {
  formData.content = e.detail || e
}

function onSave() {
  // 验证
  if (!formData.title.trim()) {
    Toast({
      message: '请输入标题',
      icon: 'none'
    })
    return
  }

  if (!formData.content.trim()) {
    Toast({
      message: '请输入提示词',
      icon: 'none'
    })
    return
  }

  saving.value = true

  // 模拟保存
  setTimeout(() => {
    const savedData = sessionStorage.getItem('worldBookData')
    if (savedData) {
      const data = JSON.parse(savedData)
      
      const item = {
        title: formData.title.trim(),
        msgType: formData.msgType,
        content: formData.content.trim()
      }
      
      // 获取原始 worldBookList
      const originalData = data._originalWorldBookList || data.worldBookList || []
      
      if (mode.value === 'edit' && data.editIndex !== undefined) {
        originalData[data.editIndex] = item
      } else {
        originalData.push(item)
      }
      
      // 调用上一页的回调
      const prevPage = window.__prevPage
      if (prevPage && typeof prevPage.confirmWorldBookItem === 'function') {
        prevPage.confirmWorldBookItem({
          item,
          index: data.editIndex,
          mode: mode.value
        })
      }
      
      // 存储更新后的数据
      sessionStorage.setItem('worldBookData', JSON.stringify({
        ...data,
        worldBookList: originalData
      }))
    }
    
    saving.value = false
    router.back()
  }, 500)
}
</script>

<style lang="scss" scoped>
.world-book-edit-page {
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

.type-selector {
  display: flex;
  gap: 24rpx;
}

.type-btn {
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

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 50;

  .van-button {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    border: none;
  }
}
</style>
