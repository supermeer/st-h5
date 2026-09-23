<template>
  <div class="feedback-page">
    <CustomNav title="" transparent :show-back="true" :show-home="false" />

    <div class="scroll-content">
      <div class="feedback-form">
        <div class="page-title">我要反馈</div>

        <!-- 反馈内容 -->
        <div class="form-item blur-glass">
          <div class="form-label">反馈内容</div>
          <textarea
            v-model="content"
            class="form-textarea"
            placeholder="请输入反馈内容"
            maxlength="5000"
            rows="6"
          ></textarea>
        </div>

        <!-- 反馈分类 -->
        <div class="form-item blur-glass">
          <div class="form-label">反馈分类</div>
          <div class="category-list">
            <div
              v-for="(item, idx) in categories"
              :key="item.id || idx"
              class="category-item"
              @click="toggleCategory(idx)"
            >
              <span class="category-label">{{ item.description || item.name }}</span>
              <div class="category-checkbox" :class="{ checked: item.checked }">
                <van-icon v-if="item.checked" name="success" size="14" color="#fff" />
              </div>
            </div>
          </div>
        </div>

        <!-- 上传图片 -->
        <div class="form-item blur-glass">
          <div class="form-label">上传图片</div>
          <div class="upload-grid">
            <div v-if="imageUrl" class="upload-item">
              <img class="upload-image" :src="imageUrl" alt="" />
              <van-icon
                name="cross"
                size="14"
                color="#fff"
                class="upload-remove"
                @click="onImageRemove"
              />
            </div>
            <div v-else class="upload-add-btn" @click="onOpenUploader">
              <van-icon name="plus" size="28" color="rgb(253, 171, 11)" />
              <span class="upload-add-text">添加图片</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="submit-container">
      <div class="contact-btn" @click="onContactService">联系客服</div>
      <div class="submit-btn" :class="{ disabled: isSubmitting }" @click="onSubmit">
        {{ isSubmitting ? '提交中...' : '提交' }}
      </div>
    </div>

    <!-- 图片上传器（占位，使用隐藏的原生 input） -->
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { getFeedbackTypes, submitFeedback } from '@/api/feedback'
import uploadFile from '@/utils/fileUploader'

const router = useRouter()

const content = ref('')
const categories = ref([])
const imageUrl = ref('')
const maxLength = 5000
const isSubmitting = ref(false)
const uploadFileList = ref([])

async function fetchCategories() {
  try {
    const list = await getFeedbackTypes()
    categories.value = (list || []).map((it) => ({ ...it, checked: false }))
  } catch (e) {
    console.warn('getFeedbackTypes failed', e)
  }
}

function toggleCategory(idx) {
  const arr = [...categories.value]
  arr[idx] = { ...arr[idx], checked: !arr[idx].checked }
  categories.value = arr
}

function onContactService() {
  showToast('请添加客服微信')
}

function onImageRemove() {
  imageUrl.value = ''
  uploadFileList.value = []
}

function onOpenUploader() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await uploadFile({
        filePath: file,
        ifPublic: true
      })
      const url = result?.url || result?.uploadUrl || ''
      if (url) {
        imageUrl.value = url
        showToast('上传成功')
      }
    } catch (err) {
      showToast(typeof err === 'string' ? err : '上传失败')
    }
  }
  input.click()
}

async function onSubmit() {
  if (isSubmitting.value) return
  if (!content.value.trim()) {
    showToast('请输入反馈内容')
    return
  }
  if (content.value.length > maxLength) {
    showToast(`反馈内容不能超过${maxLength}字`)
    return
  }
  isSubmitting.value = true
  try {
    const typeIds = categories.value.filter((it) => it.checked).map((it) => it.id)
    await submitFeedback({
      content: content.value.trim(),
      typeIds,
      imageUrl: imageUrl.value
    })
    showToast({ message: '提交成功', duration: 2000 })
    setTimeout(() => router.back(), 2000)
  } catch (e) {
    console.error('submitFeedback failed', e)
    showToast('提交失败，请重试')
    isSubmitting.value = false
  }
}

// 初始化
fetchCategories()
</script>

<style lang="scss" scoped>
.feedback-page {
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

.feedback-form {
  padding: 24rpx 24rpx calc(120rpx + env(safe-area-inset-bottom, 0px));
}

.page-title {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 32rpx;
  padding: 0 16rpx;
}

.form-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  padding: 32rpx 24rpx;
}

.form-label {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.form-textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 28rpx;
  color: #fff;
  resize: none;
  min-height: 200rpx;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 16rpx;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12rpx;
  cursor: pointer;
}

.category-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
}

.category-checkbox {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.category-checkbox.checked {
  background: linear-gradient(135deg, #6c5ce7 0%, #174dff 100%);
  border-color: transparent;
}

.upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.upload-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.upload-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  padding: 8rpx;
  cursor: pointer;
}

.upload-add-btn {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 2rpx dashed rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  gap: 8rpx;
}

.upload-add-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.submit-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(env(safe-area-inset-bottom, 0px) + 16rpx);
  background: rgba(20, 20, 30, 0.96);
  border-top: 1rpx solid rgba(255, 255, 255, 0.05);
}

.contact-btn,
.submit-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 600;
  cursor: pointer;
}

.contact-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.submit-btn {
  background: linear-gradient(135deg, #6c5ce7 0%, #174dff 100%);
  color: #fff;

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
