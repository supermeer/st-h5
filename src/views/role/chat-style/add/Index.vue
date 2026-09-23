<template>
  <div class="chat-style-add-page">
    <CustomNav title="创建风格" :show-back="true" />

    <div class="page-content">
      <div class="form-section">
        <!-- 风格标题 -->
        <div class="form-item">
          <div class="form-label">风格标题</div>
          <van-field
            v-model="formData.title"
            placeholder="请输入风格标题"
            :border="false"
            @change="onTitleInput"
          />
        </div>

        <!-- 风格描述 -->
        <div class="form-item">
          <div class="form-label">风格描述</div>
          <van-field
            v-model="formData.description"
            type="textarea"
            placeholder="请输入风格描述，描述该风格的对话特点"
            :rows="4"
            autosize
            maxlength="500"
            show-word-limit
            :border="false"
            @change="onDescriptionInput"
          />
        </div>

        <!-- 对话示例 -->
        <div class="form-item">
          <div class="form-label">对话示例</div>
          <van-field
            v-model="formData.chatExample"
            type="textarea"
            placeholder="请输入对话示例，展示该风格的典型对话"
            :rows="6"
            autosize
            maxlength="2000"
            show-word-limit
            :border="false"
            @change="onChatExampleInput"
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
        :loading="submitting"
        @click="onSubmit"
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
import { createChatStyle } from '@/api/role'

const route = useRoute()
const router = useRouter()

const submitting = ref(false)
const currentBg = ref('')

const formData = reactive({
  title: '',
  description: '',
  chatExample: ''
})

onMounted(() => {
  // 存储上一页引用
  window.__prevPage = router.currentRoute.value.meta?.prevPage
  
  if (route.query.currentBg) {
    currentBg.value = route.query.currentBg
  }
})

function onTitleInput(e) {
  formData.title = e.detail || e
}

function onDescriptionInput(e) {
  formData.description = e.detail || e
}

function onChatExampleInput(e) {
  formData.chatExample = e.detail || e
}

function onSubmit() {
  const { title, description, chatExample } = formData

  // 验证必填项
  if (!title.trim()) {
    Toast({
      message: '请输入风格标题',
      icon: 'none'
    })
    return
  }

  if (!description.trim()) {
    Toast({
      message: '请输入风格描述',
      icon: 'none'
    })
    return
  }

  if (!chatExample.trim()) {
    Toast({
      message: '请输入对话示例',
      icon: 'none'
    })
    return
  }

  submitting.value = true

  createChatStyle(formData)
    .then(res => {
      console.log(res, '----------')
      Toast({
        message: '保存成功',
        icon: 'success'
      })
      setTimeout(() => {
        router.back()
      }, 2000)
    })
    .catch(err => {
      console.error('保存失败:', err)
      Toast({
        message: '保存失败',
        icon: 'none'
      })
    })
    .finally(() => {
      submitting.value = false
    })
}
</script>

<style lang="scss" scoped>
.chat-style-add-page {
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
