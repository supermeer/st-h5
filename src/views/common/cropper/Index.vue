<template>
  <div class="page">
    <CustomNav :show-back="true" :show-left-logo="false" :show-home="false" :transparent="true" />

    <div class="cropper-container">
      <!-- 离屏 canvas -->
      <canvas ref="previewCanvasRef" class="preview-canvas" />

      <!-- 舞台 -->
      <div
        class="stage"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onTouchEnd"
      >
        <img
          v-if="imageSrc"
          id="image"
          class="image"
          :src="imageSrc"
          mode="aspectFill"
          :style="{
            width: displayWidth + 'px',
            height: displayHeight + 'px',
            transform: `translate3d(-50%, -50%, 0) translate3d(${translateX}px, ${translateY}px, 0)`,
            transformOrigin: '50% 50%'
          }"
        />

        <div class="mask">
          <div class="mask-top" :style="{ height: maskTop + 'px' }"></div>
          <div class="mask-middle">
            <div class="mask-left" :style="{ width: maskSide + 'px' }"></div>
            <div class="crop-circle" :style="{ width: cropSize + 'px', height: cropSize + 'px' }"></div>
            <div class="mask-right" :style="{ width: maskSide + 'px' }"></div>
          </div>
          <div class="mask-bottom" :style="{ height: maskBottom + 'px' }"></div>
        </div>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="toolbar">
      <button class="btn" @click="onChooseImage">选择图片</button>
      <button class="btn primary" :disabled="!imageSrc" @click="onConfirm">完成并上传</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { uploadFile } from '@/utils/fileUploader'

const route = useRoute()
const router = useRouter()

const imageSrc = ref('')
const stageWidth = ref(0)
const stageHeight = ref(0)
const cropSize = ref(300)
const maskTop = ref(0)
const maskBottom = ref(0)
const maskSide = ref(0)
const scale = ref(1)
const minScale = 0.5
const maxScale = 3
const translateX = ref(0)
const translateY = ref(0)
const imageNaturalWidth = ref(0)
const imageNaturalHeight = ref(0)
const fitScale = ref(1)
const displayWidth = ref(0)
const displayHeight = ref(0)

const previewCanvasRef = ref(null)

let touching = false
let lastTouches = []
let lastDistance = 0
let lastCenter = { x: 0, y: 0 }

onMounted(() => {
  if (route.query.src) {
    const src = decodeURIComponent(String(route.query.src))
    imageSrc.value = src
    nextTick(() => loadImageInfo(src))
  }
  initStage()
})

function initStage() {
  const w = window.innerWidth
  const h = window.innerHeight - 100
  stageWidth.value = w
  stageHeight.value = h
  const cs = Math.min(w * 0.7, h * 0.7)
  cropSize.value = cs
  maskTop.value = (h - cs) / 2
  maskBottom.value = maskTop.value
  maskSide.value = (w - cs) / 2
  translateX.value = 0
  translateY.value = 0
}

function onChooseImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      imageSrc.value = url
      scale.value = 1
      translateX.value = 0
      translateY.value = 0
      loadImageInfo(url)
    } else {
      showToast('未获取到图片')
    }
  }
  input.click()
}

function loadImageInfo(src) {
  if (!src) return
  const img = new Image()
  img.onload = () => {
    const fs = Math.max(cropSize.value / (img.naturalWidth || 1), cropSize.value / (img.naturalHeight || 1)) || 1
    imageNaturalWidth.value = img.naturalWidth
    imageNaturalHeight.value = img.naturalHeight
    fitScale.value = fs
    updateDisplaySize()
  }
  img.onerror = () => showToast('加载图片失败')
  img.src = src
}

function updateDisplaySize(nextScale) {
  const s = Math.max(minScale, Math.min(maxScale, typeof nextScale === 'number' ? nextScale : scale.value))
  scale.value = s
  displayWidth.value = Math.round(imageNaturalWidth.value * fitScale.value * s)
  displayHeight.value = Math.round(imageNaturalHeight.value * fitScale.value * s)
}

function onTouchStart(e) {
  if (!imageSrc.value) return
  const touches = e.touches
  touching = true
  lastTouches = touches
  if (touches.length === 2) {
    lastDistance = distance(touches[0], touches[1])
    lastCenter = center(touches[0], touches[1])
  }
}

function onTouchMove(e) {
  if (!touching || !imageSrc.value) return
  const touches = e.touches
  if (touches.length === 1 && lastTouches.length === 1) {
    const dx = touches[0].clientX - lastTouches[0].clientX
    const dy = touches[0].clientY - lastTouches[0].clientY
    translateX.value += dx
    translateY.value += dy
    lastTouches = touches
  } else if (touches.length === 2) {
    const newDist = distance(touches[0], touches[1])
    const scaleChange = newDist / (lastDistance || newDist)
    let newScale = scale.value * scaleChange
    const newCenter = center(touches[0], touches[1])
    const cx = newCenter.clientX - lastCenter.clientX
    const cy = newCenter.clientY - lastCenter.clientY

    updateDisplaySize(newScale)
    translateX.value += cx
    translateY.value += cy
    lastTouches = touches
    lastDistance = newDist
    lastCenter = newCenter
  } else {
    lastTouches = touches
  }
}

function onTouchEnd() {
  touching = false
  lastTouches = []
  lastDistance = 0
}

function distance(a, b) {
  const dx = a.clientX - b.clientX
  const dy = a.clientY - b.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function center(a, b) {
  return { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 }
}

async function onConfirm() {
  if (!imageSrc.value) {
    showToast('请先选择图片')
    return
  }
  showLoadingToast({ message: '处理中...', forbidClick: true })
  try {
    const tempPath = await exportCircle()
    const res = await uploadFile({ filePath: tempPath, ifPublic: true })
    // 触发回调 - 通过 history state
    const prevState = window.history.state || {}
    if (prevState.from === 'edit') {
      window.dispatchEvent(new CustomEvent('h5:cropper-done', {
        detail: { localPath: tempPath, remoteUrl: res.remoteUrl, fileKey: res.fileKey }
      }))
    }
    closeToast()
    showToast('已上传')
    setTimeout(() => router.back(), 500)
  } catch (err) {
    console.error(err)
    closeToast()
    showToast('处理失败')
  }
}

async function exportCircle() {
  const canvas = previewCanvasRef.value
  if (!canvas) throw new Error('canvas not found')
  const dpr = window.devicePixelRatio || 2
  const size = Math.floor(cropSize.value * dpr)
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  const offsetX = translateX.value
  const offsetY = translateY.value
  const baseFitScale = fitScale.value || Math.max(cropSize.value / imageNaturalWidth.value, cropSize.value / imageNaturalHeight.value)
  const drawWidth = imageNaturalWidth.value * baseFitScale * scale.value * dpr
  const drawHeight = imageNaturalHeight.value * baseFitScale * scale.value * dpr
  const dx = (offsetX * dpr) + (size - drawWidth) / 2
  const dy = (offsetY * dpr) + (size - drawHeight) / 2

  // 使用 img 加载（避免跨域问题，src 是 blob 或同源 url 即可）
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.crossOrigin = 'anonymous'
    img.src = imageSrc.value
  })
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight)
  ctx.restore()

  return canvas.toDataURL('image/png')
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #000;
  color: #fff;
  padding-top: 88px;
  display: flex;
  flex-direction: column;
}

.preview-canvas {
  width: 0;
  height: 0;
  position: absolute;
  left: -9999px;
  top: -9999px;
}

.cropper-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image {
  position: absolute;
  left: 50%;
  top: 50%;
  user-select: none;
  -webkit-user-drag: none;
}

.mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
}

.mask-top,
.mask-bottom {
  background: rgba(0, 0, 0, 0.7);
}

.mask-middle {
  display: flex;
  flex: 1;
}

.mask-left,
.mask-right {
  background: rgba(0, 0, 0, 0.7);
  flex-shrink: 0;
}

.crop-circle {
  border: 2px solid #fff;
  border-radius: 50%;
  flex-shrink: 0;
}

.toolbar {
  display: flex;
  gap: 16px;
  padding: 24px 32px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  background: #000;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  flex: 1;
  height: 80px;
  border-radius: 16px;
  font-size: 28px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  cursor: pointer;

  &.primary {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
  }

  &:disabled {
    opacity: 0.5;
  }
}
</style>
