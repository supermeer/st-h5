<template>
  <div class="set-page">
    <CustomNav title="屏幕锁设置" :show-back="true" />

    <!-- 设置主界面 -->
    <template v-if="mode === 'settings'">
      <div class="section">
        <div class="section-row">
          <div class="row-left">
            <van-icon name="lock" color="#8B5CF6" size="18" />
            <span class="row-label">屏幕锁</span>
          </div>
          <van-switch
            :model-value="lockEnabled"
            active-color="#8B5CF6"
            inactive-color="rgba(255,255,255,0.15)"
            @update:model-value="toggleLock"
          />
        </div>
        <div class="section-desc">开启后每次进入应用需验证身份</div>
      </div>

      <div class="section">
        <div class="section-title">锁屏方式</div>

        <div
          class="type-card"
          :class="{ 'type-card-active': hasGesture }"
          @click="startSetGesture"
        >
          <div class="type-card-left">
            <div class="type-icon-wrap">
              <van-icon name="apps-o" size="16" :color="hasGesture ? '#8B5CF6' : 'rgba(255,255,255,0.5)'" />
            </div>
            <div class="type-info">
              <div class="type-name">手势解锁</div>
              <div class="type-desc">{{ hasGesture ? '已设置，点击重新设置' : '绘制图案解锁' }}</div>
            </div>
          </div>
          <div class="type-actions">
            <van-icon v-if="hasGesture" name="checked" color="#10B981" size="14" />
            <div v-if="hasGesture" class="clear-btn" @click.stop="clearGesture">清除</div>
            <van-icon v-else name="arrow" color="rgba(255,255,255,0.3)" size="14" />
          </div>
        </div>

        <div
          class="type-card"
          :class="{ 'type-card-active': hasPin }"
          @click="startSetPin"
        >
          <div class="type-card-left">
            <div class="type-icon-wrap">
              <van-icon name="lock" size="16" :color="hasPin ? '#8B5CF6' : 'rgba(255,255,255,0.5)'" />
            </div>
            <div class="type-info">
              <div class="type-name">数字密码</div>
              <div class="type-desc">{{ hasPin ? '已设置，点击重新设置' : '设置6位数字密码' }}</div>
            </div>
          </div>
          <div class="type-actions">
            <van-icon v-if="hasPin" name="checked" color="#10B981" size="14" />
            <div v-if="hasPin" class="clear-btn" @click.stop="clearPin">清除</div>
            <van-icon v-else name="arrow" color="rgba(255,255,255,0.3)" size="14" />
          </div>
        </div>
      </div>

      <div class="tips-section">
        <div class="tips-title">温馨提示</div>
        <div class="tips-item">• 忘记密码可在锁屏页面点击「忘记密码」重置</div>
        <div class="tips-item">• 重置密码将关闭屏幕锁</div>
        <div class="tips-item">• 可同时设置手势和密码两种方式</div>
      </div>
    </template>

    <!-- 设置手势密码 -->
    <template v-else-if="mode === 'set_gesture'">
      <div class="setup-header">
        <div class="back-btn" @click="cancelSetMode">
          <van-icon name="arrow-left" color="rgba(255,255,255,0.7)" size="18" />
        </div>
        <div class="setup-title">设置手势密码</div>
      </div>
      <div class="setup-step-hint">
        <span class="step-badge">{{ gestureStep === 'first' ? '1' : '2' }}</span>
        <span class="step-text">{{ gestureStep === 'first' ? '第一步：绘制图案' : '第二步：再次确认' }}</span>
      </div>
      <div
        class="lock-tip"
        :class="{
          'tip-error': gestureStatus === 'error',
          'tip-success': gestureStatus === 'success'
        }"
      >{{ gestureHint }}</div>
      <div class="gesture-canvas-wrap">
        <canvas
          ref="gestureCanvasRef"
          class="gesture-canvas"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend.prevent="onTouchEnd"
        ></canvas>
      </div>
    </template>

    <!-- 设置数字密码 -->
    <template v-else-if="mode === 'set_pin'">
      <div class="setup-header">
        <div class="back-btn" @click="cancelSetMode">
          <van-icon name="arrow-left" color="rgba(255,255,255,0.7)" size="18" />
        </div>
        <div class="setup-title">设置数字密码</div>
      </div>
      <div class="setup-step-hint">
        <span class="step-badge">{{ pinStep === 'first' ? '1' : '2' }}</span>
        <span class="step-text">{{ pinStep === 'first' ? '第一步：输入密码' : '第二步：再次确认' }}</span>
      </div>
      <div class="pin-dots">
        <div
          v-for="i in 6"
          :key="i"
          class="pin-dot"
          :class="{
            filled: pinInput.length >= i,
            'dot-error': pinStatus === 'error',
            'dot-success': pinStatus === 'success'
          }"
        ></div>
      </div>
      <div
        class="lock-tip"
        :class="{
          'tip-error': pinStatus === 'error',
          'tip-success': pinStatus === 'success'
        }"
      >{{ pinHint }}</div>
      <div class="pin-pad">
        <div
          v-for="(item, idx) in numPad"
          :key="idx"
          class="pin-key"
          :class="{ 'pin-key-empty': item === '', 'pin-key-del': item === 'del' }"
          @click="onNumTap(item)"
        >
          <span v-if="item !== '' && item !== 'del'">{{ item }}</span>
          <van-icon v-else-if="item === 'del'" name="cross" color="rgba(255,255,255,0.7)" size="16" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'

const router = useRouter()

const lockEnabled = ref(false)
const mode = ref('settings') // 'settings' | 'set_gesture' | 'set_pin'
const hasGesture = ref(false)
const hasPin = ref(false)

const gestureStep = ref('first') // 'first' | 'confirm'
const gestureStatus = ref('normal')
const gestureHint = ref('请绘制图案（至少4个点）')
const pinStep = ref('first')
const pinInput = ref('')
const pinStatus = ref('normal')
const pinHint = ref('请设置6位密码')
const numPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

const gestureCanvasRef = ref(null)
let canvas = null
let ctx = null
let canvasWidth = 0
let canvasHeight = 0
let circles = []
let selectedCircles = []
let canvasRect = null
let lockStarted = false
let firstGesture = null
let firstPin = null

onMounted(() => {
  lockEnabled.value = !!localStorage.getItem('lockEnabled')
  hasGesture.value = !!localStorage.getItem('lockPattern')
  hasPin.value = !!localStorage.getItem('lockPin')
})

async function toggleLock(enabled) {
  if (!enabled) {
    try {
      await showConfirmDialog({
        title: '关闭屏幕锁',
        message: '确定要关闭屏幕锁吗？',
        confirmButtonText: '关闭',
        confirmButtonColor: '#EF4444'
      })
      localStorage.removeItem('lockEnabled')
      lockEnabled.value = false
    } catch (e) {
      lockEnabled.value = true
    }
    return
  }
  if (!hasGesture.value && !hasPin.value) {
    showToast('请先设置锁屏方式')
    lockEnabled.value = false
    return
  }
  localStorage.setItem('lockEnabled', '1')
  lockEnabled.value = true
}

function startSetGesture() {
  firstGesture = null
  selectedCircles = []
  mode.value = 'set_gesture'
  gestureStep.value = 'first'
  gestureStatus.value = 'normal'
  gestureHint.value = '请绘制图案（至少4个点）'
  nextTick(() => initCanvas())
}

function startSetPin() {
  firstPin = null
  mode.value = 'set_pin'
  pinStep.value = 'first'
  pinInput.value = ''
  pinStatus.value = 'normal'
  pinHint.value = '请设置6位密码'
}

function cancelSetMode() {
  mode.value = 'settings'
}

function initCanvas() {
  const el = gestureCanvasRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  canvasWidth = rect.width
  canvasHeight = rect.height
  canvasRect = rect
  const dpr = window.devicePixelRatio || 1
  el.width = canvasWidth * dpr
  el.height = canvasHeight * dpr
  ctx = el.getContext('2d')
  ctx.scale(dpr, dpr)
  computeCircles()
  drawGesture()
}

function computeCircles() {
  const cellW = canvasWidth / 3
  const cellH = canvasHeight / 3
  const r = Math.min(cellW, cellH) * 0.22
  circles = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      circles.push({
        cx: col * cellW + cellW / 2,
        cy: row * cellH + cellH / 2,
        r
      })
    }
  }
}

function drawGesture(currentTouch) {
  if (!ctx) return
  const w = canvasWidth
  const h = canvasHeight
  const status = gestureStatus.value
  const mainColor = status === 'error' ? '#EF4444' : status === 'success' ? '#10B981' : '#8B5CF6'
  const dimColor = 'rgba(255,255,255,0.25)'
  ctx.clearRect(0, 0, w, h)

  if (selectedCircles.length >= 2) {
    ctx.save()
    ctx.strokeStyle = mainColor
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.moveTo(circles[selectedCircles[0]].cx, circles[selectedCircles[0]].cy)
    for (let i = 1; i < selectedCircles.length; i++) {
      ctx.lineTo(circles[selectedCircles[i]].cx, circles[selectedCircles[i]].cy)
    }
    ctx.stroke()
    ctx.restore()
  }

  if (currentTouch && selectedCircles.length > 0) {
    const last = circles[selectedCircles[selectedCircles.length - 1]]
    ctx.save()
    ctx.strokeStyle = mainColor
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.4
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(last.cx, last.cy)
    ctx.lineTo(currentTouch.x, currentTouch.y)
    ctx.stroke()
    ctx.restore()
  }

  circles.forEach((circle, i) => {
    const isSelected = selectedCircles.includes(i)
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2)
      ctx.fillStyle = status === 'error'
        ? 'rgba(239,68,68,0.12)'
        : status === 'success'
        ? 'rgba(16,185,129,0.12)'
        : 'rgba(139,92,246,0.15)'
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2)
    ctx.strokeStyle = isSelected ? mainColor : dimColor
    ctx.lineWidth = isSelected ? 2.5 : 1.5
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(circle.cx, circle.cy, circle.r * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = isSelected ? mainColor : 'rgba(255,255,255,0.3)'
    ctx.fill()
  })
}

function getCircleAtPoint(x, y) {
  for (let i = 0; i < circles.length; i++) {
    const dx = x - circles[i].cx
    const dy = y - circles[i].cy
    if (Math.sqrt(dx * dx + dy * dy) <= circles[i].r * 1.5) return i
  }
  return -1
}

function onTouchStart(e) {
  if (gestureStatus.value === 'success') return
  selectedCircles = []
  lockStarted = true
  const touch = e.touches[0]
  const rect = canvasRect
  if (!rect) return
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  const idx = getCircleAtPoint(x, y)
  if (idx >= 0) selectedCircles = [idx]
  drawGesture({ x, y })
  gestureStatus.value = 'drawing'
}

function onTouchMove(e) {
  if (!lockStarted || gestureStatus.value === 'success') return
  const touch = e.touches[0]
  const rect = canvasRect
  if (!rect) return
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  const idx = getCircleAtPoint(x, y)
  if (idx >= 0 && !selectedCircles.includes(idx)) {
    selectedCircles.push(idx)
  }
  drawGesture({ x, y })
}

function onTouchEnd() {
  if (!lockStarted || gestureStatus.value === 'success') return
  lockStarted = false
  if (selectedCircles.length < 4) {
    selectedCircles = []
    gestureStatus.value = 'normal'
    gestureHint.value = '至少需要连接4个点，请重试'
    drawGesture()
    return
  }
  drawGesture()
  if (gestureStep.value === 'first') {
    firstGesture = JSON.stringify(selectedCircles)
    selectedCircles = []
    gestureStep.value = 'confirm'
    gestureStatus.value = 'normal'
    gestureHint.value = '请再次绘制确认'
    setTimeout(() => drawGesture(), 100)
  } else {
    const current = JSON.stringify(selectedCircles)
    if (current === firstGesture) {
      localStorage.setItem('lockPattern', firstGesture)
      localStorage.setItem('lockType', 'gesture')
      localStorage.setItem('lockEnabled', '1')
      gestureStatus.value = 'success'
      gestureHint.value = '手势密码设置成功'
      hasGesture.value = true
      lockEnabled.value = true
      showToast('设置成功')
      setTimeout(() => {
        mode.value = 'settings'
      }, 1500)
    } else {
      selectedCircles = []
      gestureStatus.value = 'error'
      gestureHint.value = '两次绘制不一致，请重新开始'
      setTimeout(() => {
        firstGesture = null
        gestureStep.value = 'first'
        gestureStatus.value = 'normal'
        gestureHint.value = '请绘制图案（至少4个点）'
        drawGesture()
      }, 1200)
    }
  }
}

function onNumTap(num) {
  if (pinStatus.value === 'success') return
  let cur = pinInput.value
  if (num === 'del') {
    cur = cur.slice(0, -1)
  } else if (num !== '' && cur.length < 6) {
    cur += num
  }
  pinInput.value = cur
  pinStatus.value = 'normal'

  if (cur.length === 6) {
    if (pinStep.value === 'first') {
      firstPin = cur
      pinStep.value = 'confirm'
      pinInput.value = ''
      pinHint.value = '请再次输入密码确认'
    } else {
      if (cur === firstPin) {
        localStorage.setItem('lockPin', cur)
        localStorage.setItem('lockType', 'pin')
        localStorage.setItem('lockEnabled', '1')
        pinStatus.value = 'success'
        pinInput.value = ''
        hasPin.value = true
        lockEnabled.value = true
        showToast('设置成功')
        setTimeout(() => {
          mode.value = 'settings'
          pinHint.value = '请设置6位密码'
        }, 1500)
      } else {
        pinInput.value = ''
        pinStatus.value = 'error'
        pinHint.value = '两次输入不一致，请重新开始'
        setTimeout(() => {
          firstPin = null
          pinStep.value = 'first'
          pinStatus.value = 'normal'
          pinHint.value = '请设置6位密码'
        }, 1200)
      }
    }
  }
}

async function clearGesture() {
  try {
    await showConfirmDialog({
      title: '清除手势密码',
      message: '确定清除已设置的手势密码吗？',
      confirmButtonText: '清除',
      confirmButtonColor: '#EF4444'
    })
    localStorage.removeItem('lockPattern')
    if (!localStorage.getItem('lockPin')) {
      localStorage.removeItem('lockEnabled')
      lockEnabled.value = false
    }
    hasGesture.value = false
    showToast('已清除')
  } catch (e) {
    // 用户取消
  }
}

async function clearPin() {
  try {
    await showConfirmDialog({
      title: '清除数字密码',
      message: '确定清除已设置的数字密码吗？',
      confirmButtonText: '清除',
      confirmButtonColor: '#EF4444'
    })
    localStorage.removeItem('lockPin')
    if (!localStorage.getItem('lockPattern')) {
      localStorage.removeItem('lockEnabled')
      lockEnabled.value = false
    }
    hasPin.value = false
    showToast('已清除')
  } catch (e) {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.set-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1030 0%, #0f0f1a 100%);
  color: #fff;
  padding: 88px 32px 32px;
  box-sizing: border-box;
}

.section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 32px;
}

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.row-label {
  font-size: 30px;
  color: #fff;
}

.section-desc {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8px;
}

.section-title {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 20px;
}

.type-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;

  &.type-card-active {
    border-color: rgba(139, 92, 246, 0.4);
    background: rgba(139, 92, 246, 0.1);
  }
}

.type-card-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.type-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-name {
  font-size: 28px;
  font-weight: 500;
  color: #fff;
}

.type-desc {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.5);
}

.type-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clear-btn {
  font-size: 24px;
  color: #EF4444;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.15);
  cursor: pointer;
}

.tips-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tips-title {
  font-size: 26px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.tips-item {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
}

.setup-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-btn {
  padding: 8px;
  cursor: pointer;
}

.setup-title {
  font-size: 32px;
  font-weight: 600;
  color: #fff;
}

.setup-step-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 700;
}

.step-text {
  font-size: 28px;
  color: #fff;
}

.lock-tip {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  min-height: 60px;
  line-height: 60px;
  margin: 16px 0;
}

.lock-tip.tip-error {
  color: #EF4444;
}

.lock-tip.tip-success {
  color: #10B981;
}

.gesture-canvas-wrap {
  width: 600px;
  height: 600px;
  margin: 20px auto;
  max-width: 90vw;
  max-height: 90vw;
}

.gesture-canvas {
  width: 100%;
  height: 100%;
  touch-action: none;
}

.pin-dots {
  display: flex;
  gap: 32px;
  justify-content: center;
  margin: 20px 0 8px;
}

.pin-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
}

.pin-dot.filled {
  background: #8B5CF6;
  border-color: #8B5CF6;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
}

.pin-dot.dot-error {
  border-color: #EF4444;
}

.pin-dot.dot-error.filled {
  background: #EF4444;
  border-color: #EF4444;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
}

.pin-dot.dot-success.filled {
  background: #10B981;
  border-color: #10B981;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
}

.pin-pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 48px;
  width: 600px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.pin-key {
  height: 120px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
}

.pin-key:active {
  background: rgba(139, 92, 246, 0.25);
}

.pin-key-empty {
  background: transparent;
  pointer-events: none;
}

.pin-key-del {
  background: rgba(255, 255, 255, 0.04);
}
</style>
