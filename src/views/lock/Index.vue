<template>
  <div class="lock-page">
    <div class="lock-header">
      <div class="lock-icon-wrap">
        <van-icon name="lock" color="#8B5CF6" size="22" />
      </div>
      <div class="lock-app-name">星语酒馆</div>
      <div class="lock-app-sub">屏幕已锁定</div>
    </div>

    <!-- 手势解锁 -->
    <div v-if="lockType === 'gesture'" class="gesture-section">
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
    </div>

    <!-- 密码解锁 -->
    <div v-else-if="lockType === 'pin'" class="pin-section">
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
    </div>

    <!-- 底部操作 -->
    <div class="lock-footer">
      <div
        v-if="(lockType === 'pin' && hasGesture) || (lockType === 'gesture' && hasPin)"
        class="lock-switch-btn"
        @click="switchLockType"
      >{{ lockType === 'gesture' ? '使用密码解锁' : '使用手势解锁' }}</div>
      <div class="lock-forgot-btn" @click="onForgot">忘记密码</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'

const router = useRouter()

const lockType = ref('gesture') // 'gesture' | 'pin'
const gestureStatus = ref('normal') // 'normal' | 'drawing' | 'error' | 'success'
const gestureHint = ref('请绘制解锁图案')
const pinInput = ref('')
const pinStatus = ref('normal') // 'normal' | 'error' | 'success'
const pinHint = ref('请输入密码')
const numPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
const hasGesture = ref(false)
const hasPin = ref(false)

const gestureCanvasRef = ref(null)
let canvas = null
let ctx = null
let canvasWidth = 0
let canvasHeight = 0
let circles = []
let selectedCircles = []
let canvasRect = null
let lockStarted = false
let errorCount = 0

onMounted(() => {
  const storedType = localStorage.getItem('lockType') || 'gesture'
  hasGesture.value = !!localStorage.getItem('lockPattern')
  hasPin.value = !!localStorage.getItem('lockPin')
  let active = storedType
  if (active === 'gesture' && !hasGesture.value && hasPin.value) active = 'pin'
  if (active === 'pin' && !hasPin.value && hasGesture.value) active = 'gesture'
  lockType.value = active

  if (lockType.value === 'gesture') {
    nextTick(() => initCanvas())
  }
})

onBeforeUnmount(() => {
  // nothing
})

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
  const mainColor = gestureStatus.value === 'error' ? '#EF4444' : '#8B5CF6'
  const dimColor = 'rgba(255,255,255,0.25)'
  ctx.clearRect(0, 0, w, h)

  // Connection lines
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

  // Line to current touch
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

  // Circles
  circles.forEach((circle, i) => {
    const isSelected = selectedCircles.includes(i)
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2)
      ctx.fillStyle = gestureStatus.value === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(139,92,246,0.15)'
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
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist <= circles[i].r * 1.5) return i
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
  gestureHint.value = '请绘制解锁图案'
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
    gestureHint.value = '至少需要连接4个点'
    drawGesture()
    return
  }
  drawGesture()
  verifyGesture()
}

function verifyGesture() {
  const pattern = JSON.stringify(selectedCircles)
  const stored = localStorage.getItem('lockPattern')
  if (pattern === stored) {
    gestureStatus.value = 'success'
    gestureHint.value = '解锁成功'
    setTimeout(() => router.back(), 500)
  } else {
    errorCount++
    const remaining = 5 - errorCount
    if (remaining <= 0) {
      gestureStatus.value = 'error'
      gestureHint.value = '尝试次数已达上限'
      if (hasPin.value) {
        setTimeout(() => switchLockType(), 1500)
      }
      return
    }
    gestureStatus.value = 'error'
    gestureHint.value = `图案不正确，还可尝试 ${remaining} 次`
    setTimeout(() => {
      selectedCircles = []
      gestureStatus.value = 'normal'
      gestureHint.value = '请重新绘制图案'
      drawGesture()
    }, 1000)
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
  pinHint.value = '请输入密码'
  if (cur.length === 6) verifyPin(cur)
}

function verifyPin(pin) {
  const stored = localStorage.getItem('lockPin')
  if (pin === stored) {
    pinStatus.value = 'success'
    pinHint.value = '解锁成功'
    setTimeout(() => router.back(), 500)
  } else {
    errorCount++
    const remaining = 5 - errorCount
    if (remaining <= 0) {
      pinInput.value = ''
      pinStatus.value = 'error'
      pinHint.value = '尝试次数已达上限'
      return
    }
    pinInput.value = ''
    pinStatus.value = 'error'
    pinHint.value = `密码错误，还可尝试 ${remaining} 次`
  }
}

function switchLockType() {
  const newType = lockType.value === 'gesture' ? 'pin' : 'gesture'
  errorCount = 0
  lockType.value = newType
  pinInput.value = ''
  pinStatus.value = 'normal'
  pinHint.value = '请输入密码'
  gestureStatus.value = 'normal'
  gestureHint.value = '请绘制解锁图案'
  if (newType === 'gesture') {
    selectedCircles = []
    nextTick(() => initCanvas())
  }
}

async function onForgot() {
  try {
    await showConfirmDialog({
      title: '忘记密码',
      message: '重置密码将清除屏幕锁，确定继续吗？',
      confirmButtonText: '重置',
      confirmButtonColor: '#8B5CF6'
    })
    localStorage.removeItem('lockEnabled')
    localStorage.removeItem('lockPattern')
    localStorage.removeItem('lockPin')
    localStorage.removeItem('lockType')
    router.replace('/pages/home/home')
  } catch (e) {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.lock-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 48px var(--safearea-bottom);
  padding-top: var(--safearea-top);
  background: linear-gradient(180deg, #1a1030 0%, #0f0f1a 50%, #0a0a14 100%);
  color: #fff;
  box-sizing: border-box;
}

.lock-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120px;
  padding-bottom: 60px;
}

.lock-icon-wrap {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.15);
  border: 2px solid rgba(139, 92, 246, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.lock-app-name {
  font-size: 40px;
  font-weight: bold;
  color: #ffffff;
  letter-spacing: 4px;
}

.lock-app-sub {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 12px;
}

.gesture-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.gesture-canvas-wrap {
  width: 600px;
  height: 600px;
  margin-top: 20px;
  max-width: 90vw;
  max-height: 90vw;
}

.gesture-canvas {
  width: 100%;
  height: 100%;
  touch-action: none;
}

.pin-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.pin-dots {
  display: flex;
  gap: 32px;
  margin-top: 20px;
  margin-bottom: 8px;
}

.pin-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  transition: all 0.15s;
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

.lock-tip {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  min-height: 60px;
  line-height: 60px;
  margin-top: 16px;
}

.lock-tip.tip-error {
  color: #EF4444;
}

.lock-tip.tip-success {
  color: #10B981;
}

.pin-pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 48px;
  width: 600px;
  max-width: 90vw;
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
  color: #ffffff;
  transition: background 0.15s;
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

.lock-footer {
  margin-top: auto;
  padding-bottom: calc(60px + var(--safearea-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.lock-switch-btn {
  font-size: 28px;
  color: #8B5CF6;
  padding: 16px 40px;
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 40px;
  cursor: pointer;
}

.lock-forgot-btn {
  font-size: 26px;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
}
</style>
