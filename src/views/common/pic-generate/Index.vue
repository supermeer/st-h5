<template>
  <div class="pic-generate-page">
    <CustomNav title="" :show-back="true" :show-home="false" :transparent="true" />

    <div class="scroll-content">
      <div class="page-content">
        <!-- 图片风格选择 -->
        <div class="section">
          <div class="section-title">图片风格</div>
          <div class="style-scroll">
            <div class="style-list">
              <div
                v-for="item in styleList"
                :key="item.id"
                class="style-item"
                :class="{ active: selectedStyle === item.id }"
                @click="onSelectStyle(item.id)"
              >
                <div class="style-image-wrapper">
                  <img class="style-image" :src="item.image" alt="" />
                  <div class="style-mask"></div>
                </div>
                <div class="style-name">{{ item.name }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 文字描述 -->
        <div class="section">
          <div class="section-title">文字描述</div>
          <div class="description-wrapper blur-glass">
            <textarea
              v-model="description"
              class="description-input"
              placeholder="工作于便利店的店员。在便利店工作时化名山田，工作精神格满、穿着便利店工作服，身着黑色皮发箍皮衣……"
              :maxlength="maxLength"
            />
            <div class="bottom-line">
              <div class="optimize-btn" @click="onOptimizeBtnTap">
                <van-icon name="bulb-o" color="#FFD700" size="14" />
                <span>优化提示词</span>
              </div>
              <div class="char-count">{{ description.length }}/{{ maxLength }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 优化弹窗 -->
    <van-dialog
      v-model:show="optimizeForm.visible"
      title="优化提示词"
      show-cancel-button
      @confirm="onOptimizeConfirm"
      @cancel="onOptimizeCancel"
    >
      <div class="optimize-dialog">
        <p>是否使用 AI 优化您的描述？</p>
        <textarea
          v-model="optimizeForm.text"
          class="optimize-textarea"
          rows="4"
        />
      </div>
    </van-dialog>

    <!-- 底部按钮 -->
    <div class="generate-footer">
      <div class="generate-btn" @click="onGenerate">立即生成</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'

const router = useRouter()

const styleList = ref([
  { id: 'anime', name: '日漫风', image: '/static/role-bg/xxg_bg_mini.jpg' },
  { id: 'cute', name: '可爱风', image: '/static/role-bg/xxg_bg_mini.jpg' },
  { id: 'realistic', name: '写实风', image: '/static/role-bg/xxg_bg_mini.jpg' },
  { id: 'creative', name: '创意', image: '/static/role-bg/xxg_bg_mini.jpg' },
  { id: 'chinese', name: '国风', image: '/static/role-bg/xxg_bg_mini.jpg' }
])

const selectedStyle = ref('')
const description = ref('')
const maxLength = ref(300)
const optimizeForm = reactive({
  visible: false,
  text: ''
})

function onSelectStyle(id) {
  selectedStyle.value = id
}

function onOptimizeBtnTap() {
  if (!description.value.length) {
    showToast('请先输入文字描述')
    return
  }
  optimizeForm.text = description.value
  optimizeForm.visible = true
}

function onOptimizeConfirm() {
  if (optimizeForm.text && optimizeForm.text.trim()) {
    description.value = optimizeForm.text.trim()
  }
  optimizeForm.visible = false
}

function onOptimizeCancel() {
  optimizeForm.visible = false
}

function onGenerate() {
  if (!description.value.trim()) {
    showToast('请输入文字描述')
    return
  }
  const params = {
    style: selectedStyle.value,
    description: description.value
  }
  router.push({
    path: '/pages/common/pic-generate/result/index',
    query: { params: encodeURIComponent(JSON.stringify(params)) }
  })
}
</script>

<style lang="scss" scoped>
.pic-generate-page {
  min-height: 100vh;
  background: #1a1a1a;
  color: #fff;
  padding-top: 88px;
  padding-bottom: 160px;
}

.scroll-content {
  min-height: calc(100vh - 88px - 160px);
}

.page-content {
  padding: 24px 32px;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 24px;
}

.style-scroll {
  overflow-x: auto;
  margin: 0 -32px;
  padding: 0 32px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.style-list {
  display: flex;
  gap: 16px;
  padding-bottom: 8px;
}

.style-item {
  flex-shrink: 0;
  cursor: pointer;
  text-align: center;

  &.active .style-mask {
    background: rgba(255, 95, 21, 0.3);
    border: 4px solid #FF5F15;
  }
}

.style-image-wrapper {
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 8px;
}

.style-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.style-mask {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  border: 4px solid transparent;
  transition: border-color 0.2s;
}

.style-name {
  font-size: 26px;
  color: #fff;
}

.description-wrapper {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
}

.description-input {
  width: 100%;
  min-height: 200px;
  background: transparent;
  border: none;
  outline: none;
  font-size: 28px;
  color: #fff;
  line-height: 1.6;
  resize: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
}

.bottom-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.optimize-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 215, 0, 0.15);
  border-radius: 16px;
  font-size: 24px;
  color: #FFD700;
  cursor: pointer;
}

.char-count {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.4);
}

.generate-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 32px;
  padding-bottom: calc(24px + var(--safearea-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 100;
}

.generate-btn {
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border-radius: 44px;
  padding: 28px;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}

.optimize-dialog {
  padding: 24px;
  font-size: 28px;
  color: rgba(255, 255, 255, 0.8);

  p {
    margin-bottom: 16px;
  }
}

.optimize-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  font-size: 28px;
  color: #fff;
  outline: none;
  resize: vertical;
}
</style>
