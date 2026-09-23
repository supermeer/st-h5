<template>
  <div class="page">
    <CustomNav :title="title || '评价'" :show-back="true" />

    <div class="page-content">
      <!-- 选择博主 -->
      <div class="selector-container section blur-glass">
        <div class="section-header">
          <span class="section-title">博主</span>
        </div>
        <div class="selector-item" @click="onBlogTap">
          <span v-if="blogForm.value.length > 0" class="selector-item-title">
            {{ blogForm.labelStr }}
          </span>
          <span v-else class="selector-item-placeholder">请选择</span>
          <van-icon name="arrow" color="#999" />
        </div>
        <div v-if="historyBlogList.length" class="history-container">
          <span
            v-for="item in historyBlogList"
            :key="item.id"
            class="history-tag"
            @click="onHistoryBlogTap(item)"
          >{{ item.name }}</span>
        </div>
      </div>

      <!-- 选择风格类型 -->
      <div class="selector-container section blur-glass">
        <div class="section-header">
          <span class="section-title">风格类型</span>
        </div>
        <div class="selector-item" @click="onStyleItemTap">
          <span v-if="!formData.baowenStyleId" class="selector-item-placeholder">请选择</span>
          <span v-else class="selector-item-title">{{ formData.baowenStyleName }}</span>
          <van-icon name="arrow" color="#999" />
        </div>
      </div>

      <!-- 笔记要求 -->
      <div class="section blur-glass">
        <div class="section-header">
          <span class="section-title">笔记要求</span>
          <span class="clear-btn" @click="onClearBtnTap">
            清空
            <van-icon name="cross" size="14" />
          </span>
        </div>
        <div class="textarea-container">
          <textarea
            v-model="commentContent"
            class="comment-textarea"
            placeholder="请告诉我具体细节，如人物特征、具体事情、真实感受等。您描述的越具体，我给出的笔记真实感越强哦~"
            :maxlength="maxCommentLength"
            @blur="onCommentBlur"
          ></textarea>
          <div class="word-count">{{ commentContent.length }}/{{ maxCommentLength }}</div>
        </div>

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

      <div class="tip-word">-生成文案仅供参考-</div>

      <div class="button-group">
        <div class="btn-history" @click="viewHistory">
          <van-icon name="clock-o" size="22" color="#174DFF" />
        </div>
        <div class="btn-generate" @click="generateContent">立即生成</div>
      </div>
    </div>

    <!-- 博主选择弹层 -->
    <van-popup v-model:show="blogForm.visible" position="bottom" round>
      <van-picker
        :columns="blogFormColumns"
        @confirm="onPickerConfirm"
        @cancel="onPickerCancel"
        @change="onColumnChange"
        title="选择博主"
      />
    </van-popup>

    <!-- 风格选择弹层 -->
    <van-action-sheet
      v-model:show="styleActionSheet.visible"
      :actions="styleActionSheet.items"
      cancel-text="取消"
      description="选择风格类型"
      @select="onStyleSelect"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { getBloggerType, getStyleList, createSession } from '@/api/ai/chat'
import { getBloggerTypeHistory } from '@/api/home/home'
import { uploadFile } from '@/utils/fileUploader'

const route = useRoute()
const router = useRouter()

const title = ref('写博文')
const commentContent = ref('')
const maxCommentLength = 1000
const maxImageCount = 9
const imageList = ref([])
const selectedBlog = ref(null)
const selectedStyle = ref(null)

const blogForm = reactive({
  value: [],
  label: [],
  labelStr: '',
  visible: false,
  bloggertype: [],
  bloggerSubType: []
})

const formData = reactive({
  baowenStyleId: null,
  baowenStyleName: null,
  bloggerTypeId: null,
  menuId: null
})

const styleActionSheet = reactive({
  visible: false,
  items: [],
  loading: false,
  hasLoaded: false
})

const styleList = ref([])
const historyBlogList = ref([])

// 博主选择弹层 picker columns（双列）
const blogFormColumns = computed(() => [
  blogForm.bloggertype,
  blogForm.bloggerSubType
])

onMounted(async () => {
  if (route.query.id) {
    formData.menuId = route.query.id
  }
  if (route.query.title) {
    title.value = route.query.title
  }
  getBlogType()
  loadStyleList()
  loadHistory()
})

async function loadHistory() {
  try {
    const res = await getBloggerTypeHistory()
    historyBlogList.value = res || []
  } catch (e) {
    historyBlogList.value = []
  }
}

async function getBlogType() {
  try {
    const res = await getBloggerType()
    const bloggertype = (res || []).map((item) => ({
      ...item,
      label: item.name,
      value: item.id
    }))
    if (bloggertype.length === 0) return
    blogForm.bloggertype = bloggertype
    blogForm.bloggerSubType = (bloggertype[0].children || []).map((item) => ({
      ...item,
      label: item.name,
      value: item.id
    }))
  } catch (e) {
    console.error('加载博主类型失败', e)
  }
}

async function loadStyleList() {
  try {
    styleActionSheet.loading = true
    const res = await getStyleList()
    const items = Array.isArray(res) ? res : res?.list || res?.items || res?.records || res?.data || []
    const actionItems = items.map((style) => ({ name: style.name, _id: style.id }))
    styleList.value = items
    styleActionSheet.items = actionItems
    styleActionSheet.hasLoaded = true
  } catch (e) {
    styleActionSheet.hasLoaded = true
  } finally {
    styleActionSheet.loading = false
  }
}

function onHistoryBlogTap(item) {
  const { parentId, parentName, name, id } = item
  formData.bloggerTypeId = id
  formData.bloggerTypeName = name
  blogForm.value = [parentId, id]
  blogForm.label = [parentName, name]
  blogForm.labelStr = `${parentName} / ${name}`
}

function onClearBtnTap() {
  commentContent.value = ''
  showToast('已清空')
}

function onCommentBlur(e) {
  let value = e.target.value
  if (value && value.length > maxCommentLength) {
    commentContent.value = value.substring(0, maxCommentLength)
  }
}

function onBlogTap() {
  if (blogForm.value.length > 0) {
    const type = blogForm.bloggertype.find(
      (item) => item.value === blogForm.value[0]
    )
    if (type) {
      blogForm.bloggerSubType = (type.children || []).map((item) => ({
        ...item,
        label: item.name,
        value: item.id
      }))
    }
  }
  blogForm.visible = true
}

function onPickerConfirm({ selectedValues, selectedOptions }) {
  const value = selectedValues
  const subType = blogForm.bloggerSubType[selectedOptions[1]?.index ?? 0]
  if (!subType) return
  blogForm.value = [value[0], subType.value]
  blogForm.visible = false
  blogForm.label = [selectedOptions[0]?.text || '', subType.label]
  blogForm.labelStr = `${selectedOptions[0]?.text || ''} / ${subType.label}`
  formData.bloggerTypeId = subType.value
}

function onPickerCancel() {
  blogForm.visible = false
}

function onColumnChange({ selectedOptions, columnIndex, index }) {
  if (columnIndex === 0) {
    const type = blogForm.bloggertype[index]
    if (type) {
      blogForm.bloggerSubType = (type.children || []).map((item) => ({
        ...item,
        label: item.name,
        value: item.id
      }))
    }
  }
}

function onStyleItemTap() {
  if (!styleActionSheet.hasLoaded && !styleActionSheet.loading) {
    loadStyleList()
  }
  styleActionSheet.visible = true
}

function onStyleSelect(action) {
  const idx = styleActionSheet.items.findIndex((a) => a.name === action.name)
  const style = styleList.value[idx]
  if (style) {
    formData.baowenStyleId = style.id
    formData.baowenStyleName = style.name
  }
  styleActionSheet.visible = false
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
  input.multiple = true
  input.onchange = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      if (imageList.value.length >= maxImageCount) break
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
  }
  input.click()
}

function handleRemove(idx) {
  imageList.value.splice(idx, 1)
}

async function generateContent() {
  if (imageList.value.some((f) => f.status === 'loading')) {
    showToast('请等待上传完成')
    return
  }
  if (!formData.bloggerTypeId) {
    showToast('请选择博主')
    return
  }
  if (!formData.baowenStyleId) {
    showToast('请选择风格类型')
    return
  }
  if (!commentContent.value.trim()) {
    showToast('请输入笔记要求')
    return
  }

  showLoadingToast({ message: '生成中...', forbidClick: true })

  try {
    const sessionId = await createSession({
      menuId: formData.menuId,
      bloggerTypeId: formData.bloggerTypeId,
      baowenStyleId: formData.baowenStyleId
    })
    localStorage.setItem('commentContent', commentContent.value)
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

.selector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 16px;
}

.selector-item-title {
  font-size: 28px;
  color: #fff;
}

.selector-item-placeholder {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.3);
}

.history-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.history-tag {
  font-size: 24px;
  padding: 8px 20px;
  background: rgba(23, 77, 255, 0.15);
  color: #63B4FF;
  border-radius: 24px;
  cursor: pointer;
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
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
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
}
</style>
