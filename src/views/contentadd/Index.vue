<template>
  <div class="page">
    <!-- 自定义导航栏 -->
    <CustomNav :title="title || '内容添加'" :show-back="true" />

    <div class="page-content">
      <!-- 评分 -->
      <div class="rate-container blur-glass">
        <div class="rate-row">
          <span class="rate-label">
            {{ categoryInfo.commentType === 'score' ? '好评度' : '综合评分' }}
          </span>
          <div class="rate-stars">
            <van-icon
              v-for="n in 5"
              :key="n"
              :name="formData.rateScore >= n ? 'star' : 'star-o'"
              :color="formData.rateScore >= n ? '#FFD700' : '#666'"
              size="20"
              @click="onRateChange(n)"
            />
          </div>
        </div>
      </div>

      <!-- 评价内容 -->
      <div class="section blur-glass">
        <div class="section-header">
          <span class="section-title">评价内容</span>
          <span v-if="originCommentContent" class="undo-btn" @click="onUndoClick">撤销</span>
          <span class="clear-btn" @click="onClearBtnTap">
            清空
            <van-icon name="cross" size="14" />
          </span>
        </div>
        <div class="textarea-container">
          <textarea
            v-model="commentContent"
            class="comment-textarea"
            placeholder="请输入您的评价内容..."
            :maxlength="maxCommentLength"
            @blur="onCommentBlur"
          ></textarea>
          <div class="word-count">{{ commentContent.length }}/{{ maxCommentLength }}</div>
        </div>

        <!-- 图片上传 -->
        <div class="image-uploader">
          <div class="image-list">
            <div v-for="(img, idx) in imageList" :key="idx" class="image-item">
              <img :src="img.url" alt="" />
              <div class="image-delete" @click="handleRemove(idx)">
                <van-icon name="cross" color="#fff" size="14" />
              </div>
            </div>
            <div v-if="imageList.length < maxImageCount" class="upload-add-btn" @click="onChooseImage">
              <van-icon name="plus" size="24" color="#174DFF" />
            </div>
          </div>
        </div>
      </div>

      <!-- 参考模板 -->
      <div class="template-section section blur-glass" @click="onTemplateClick">
        <div class="section-header template-header">
          <span class="section-title">参考模板</span>
        </div>
        <div class="template-content">{{ categoryInfo.template || '点击使用模板' }}</div>
      </div>

      <div class="tip-word">-生成文案仅供参考-</div>

      <!-- 底部按钮 -->
      <div class="button-group">
        <div class="btn-history" @click="viewHistory">
          <van-icon name="clock-o" size="22" color="#174DFF" />
        </div>
        <div class="btn-generate" @click="generateContent">立即生成</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { getCommentCategory, createSession } from '@/api/ai/chat'
import { uploadFile } from '@/utils/fileUploader'

const route = useRoute()
const router = useRouter()

const title = ref('')
const rateScore = ref(0)
const commentContent = ref('')
const originCommentContent = ref('')
const maxCommentLength = 500
const maxImageCount = 2
const imageList = ref([])
const categoryInfo = ref({
  commentLevel: [],
  commentType: '',
  template: '',
  id: null
})
const formData = reactive({
  menuId: null,
  rateScore: null,
  commentPlatformId: null
})

onMounted(() => {
  if (route.query.id) {
    formData.menuId = route.query.id
    getCategoryInfo()
  }
  if (route.query.title) {
    title.value = route.query.title
  }
})

async function getCategoryInfo() {
  try {
    const res = await getCommentCategory({ menuId: formData.menuId })
    let levels = []
    try {
      levels = res.commentLevel ? JSON.parse(res.commentLevel) : []
    } catch (e) {
      levels = []
    }
    categoryInfo.value = {
      ...res,
      commentLevel: levels
    }
    formData.commentPlatformId = res.id
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

function onRateChange(score) {
  rateScore.value = score
  formData.rateScore = score
}

function onClearBtnTap() {
  commentContent.value = ''
  originCommentContent.value = ''
  showToast('已清空')
}

function onCommentBlur(e) {
  let value = e.target.value
  if (value && value.length > maxCommentLength) {
    commentContent.value = value.substring(0, maxCommentLength)
  }
}

function onUndoClick() {
  commentContent.value = originCommentContent.value
  originCommentContent.value = ''
}

function onTemplateClick() {
  if (!categoryInfo.value.template) {
    showToast('暂无模板')
    return
  }
  originCommentContent.value = commentContent.value
  commentContent.value = categoryInfo.value.template
}

function viewHistory() {
  showToast('历史记录功能开发中')
}

function onChooseImage() {
  if (imageList.value.length >= maxImageCount) {
    showToast(`最多上传 ${maxImageCount} 张图片`)
    return
  }
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = false
  input.onchange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const fileObj = {
      url: URL.createObjectURL(file),
      status: 'loading',
      rawFile: file,
      fileKey: ''
    }
    imageList.value.push(fileObj)
    const idx = imageList.value.length - 1
    try {
      const res = await uploadFile({ filePath: file, ifPublic: true })
      imageList.value[idx].url = res.remoteUrl || fileObj.url
      imageList.value[idx].status = 'success'
      imageList.value[idx].fileKey = res.fileKey
    } catch (err) {
      showToast('上传失败')
      imageList.value.splice(idx, 1)
    }
  }
  input.click()
}

function handleRemove(idx) {
  imageList.value.splice(idx, 1)
}

async function generateContent() {
  // 校验
  if (imageList.value.some((f) => f.status === 'loading')) {
    showToast('请等待上传完成')
    return
  }
  if (!formData.rateScore && formData.rateScore !== 0) {
    showToast('请评分')
    return
  }
  if (!commentContent.value.trim() && imageList.value.length === 0) {
    showToast('请输入评价内容或上传图片')
    return
  }

  showLoadingToast({ message: '生成中...', forbidClick: true })

  try {
    const sessionId = await createSession({
      menuId: formData.menuId,
      commentPlatformId: formData.commentPlatformId
    })
    localStorage.setItem('commentContent', commentContent.value)
    localStorage.setItem('rateScore', String(formData.rateScore))
    localStorage.setItem('imageKeys', JSON.stringify(imageList.value.map((item) => item.fileKey).filter(Boolean)))
    localStorage.setItem('imageList', JSON.stringify(imageList.value.map((item) => item.url)))

    closeToast()
    router.replace({ path: '/pages/chat/index', query: { sessionId, isCreate: 'true' } })
  } catch (err) {
    closeToast()
    if (err && err.code === 402) {
      try {
        await showConfirmDialog({
          title: '次数不足',
          message: '次数不足，请升级会员或购买加油包',
          confirmButtonText: '立即购买',
          cancelButtonText: '取消'
        })
        router.push('/pages/vip/packages/index')
      } catch (e) {
        // 用户取消
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #252525;
  padding-top: 88px;
  padding-bottom: 200px;
}

.page-content {
  padding: 0 16px;
  min-height: 100%;
}

.rate-container {
  margin-top: 16px;
  height: 96px;
  line-height: 96px;
  border-radius: 24px;
  box-sizing: border-box;
  padding: 0 32px;
  width: 100%;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.rate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.rate-label {
  font-size: 28px;
  color: #fff;
  font-weight: bold;
}

.rate-stars {
  display: flex;
  gap: 8px;
}

.section {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  margin-bottom: 16px;
  padding: 26px 32px;
  width: 100%;
  box-sizing: border-box;
}

.section-header {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.section-title {
  flex: 1;
}

.undo-btn {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: normal;
  margin-right: 16px;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: normal;
  gap: 4px;
}

.textarea-container {
  position: relative;
  width: 100%;
  padding-bottom: 50px;
}

.comment-textarea {
  width: 100%;
  min-height: 200px;
  padding: 10px 0;
  font-size: 28px;
  border-radius: 8px;
  box-sizing: border-box;
  line-height: 1.6;
  background: transparent;
  border: none;
  color: #fff;
  resize: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
}

.word-count {
  position: absolute;
  bottom: 10px;
  right: 0;
  font-size: 24px;
  color: #999;
}

.image-uploader {
  margin-top: 30px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-item {
  width: 96px;
  height: 96px;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    object-fit: cover;
  }
}

.image-delete {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-add-btn {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  background: rgba(23, 77, 255, 0.15);
  border: 2px dashed #174DFF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-section {
  background: linear-gradient(180deg, rgba(23, 77, 255, 0.06) 0%, rgba(255, 255, 255, 0) 95%);
  border: 1px solid #174DFF;
  color: rgba(255, 255, 255, 0.8);
  font-size: 28px;
}

.template-content {
  font-size: 24px;
  line-height: 40px;
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 0;
  min-height: 60px;
  white-space: pre-wrap;
  word-break: break-all;
}

.tip-word {
  font-size: 24px;
  color: #aaa;
  text-align: center;
  letter-spacing: 0.8px;
  margin-top: 24px;
}

.button-group {
  position: fixed;
  bottom: 12px;
  left: 0;
  right: 0;
  padding: 0 32px;
  z-index: 100;
  display: flex;
  align-items: center;
  padding-bottom: calc(12px + var(--safearea-bottom));
}

.btn-history {
  width: 80px;
  height: 80px;
  background: rgba(23, 77, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-generate {
  margin-left: 24px;
  font-size: 28px;
  flex: 1;
  height: 92px;
  line-height: 92px;
  color: #fff;
  background: linear-gradient(102deg, #63B4FF 16%, #174DFF 89%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  text-align: center;
}
</style>
