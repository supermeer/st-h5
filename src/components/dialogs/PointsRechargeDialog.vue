<template>
  <van-popup
    v-model:show="visible"
    round
    :close-on-click-overlay="false"
    class="points-recharge-dialog"
  >
    <div class="dialog-content">
      <!-- 关闭按钮 -->
      <div class="dialog-close" @click="handleClose">×</div>

      <!-- 标题 -->
      <div class="dialog-title">能量不足</div>
      <div class="dialog-subtitle">充值能量继续对话</div>

      <!-- 套餐列表 -->
      <div class="plan-list">
        <div
          v-for="(plan, index) in plans"
          :key="plan.id || index"
          class="plan-item"
          :class="{ selected: selectedIndex === index }"
          @click="selectedIndex = index"
        >
          <div class="plan-points">{{ plan.point || plan.points }}能量</div>
          <div class="plan-price">¥{{ plan.price }}</div>
          <div v-if="plan.originalPrice" class="plan-original">
            ¥{{ plan.originalPrice }}
          </div>
        </div>
      </div>

      <!-- 协议 -->
      <div class="agreement-tip">
        点击确认即表示同意
        <span class="agreement-link" @click="goAgreement">《用户协议》</span>
      </div>

      <!-- 确认按钮 -->
      <van-button 
        type="primary" 
        block 
        round 
        class="confirm-btn"
        @click="handleRecharge"
      >
        确认充值
      </van-button>
    </div>
  </van-popup>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { getPricingPlan, createOrderAndPrepay } from '@/api/order'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const visible = ref(false)
const plans = ref([])
const selectedIndex = ref(0)

let _onSuccess = null

async function show(options = {}) {
  _onSuccess = options.onSuccess
  selectedIndex.value = 0
  visible.value = true
  
  await loadPlans()
}

function hide() {
  visible.value = false
  _onSuccess = null
}

function handleClose() {
  hide()
}

async function loadPlans() {
  try {
    const res = await getPricingPlan({ type: 1 })
    plans.value = (res || []).map(item => ({
      ...item,
      price: ((item.amountInFen || 0) / 100).toFixed(1)
    }))
  } catch (e) {
    console.error('获取套餐失败', e)
    plans.value = []
  }
}

function goAgreement() {
  router.push('/pages/common/agreement/index?type=1')
}

async function handleRecharge() {
  const plan = plans.value[selectedIndex.value]
  if (!plan) return

  showLoadingToast({ message: '处理中...', forbidClick: true })

  try {
    const openId = localStorage.getItem('openId')
    const res = await createOrderAndPrepay({
      openId,
      orderType: plan.orderType,
      count: 1
    })

    // H5 环境模拟支付成功
    closeToast()
    showToast({ message: '充值成功', icon: 'success' })
    
    // 刷新积分
    userStore.refreshPointInfo()

    if (typeof _onSuccess === 'function') {
      _onSuccess(res)
    }

    hide()
  } catch (e) {
    closeToast()
    showToast({ message: '充值失败', icon: 'none' })
  }
}

defineExpose({ show, hide })
</script>

<style lang="scss" scoped>
.points-recharge-dialog {
  width: 640rpx;
}

.dialog-content {
  position: relative;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  padding-bottom: calc(48rpx + var(--safearea-bottom));
}

.dialog-close {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  font-size: 48rpx;
  color: #999;
  z-index: 1;
}

.dialog-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
}

.dialog-subtitle {
  font-size: 28rpx;
  color: #999;
  text-align: center;
  margin-top: 12rpx;
  margin-bottom: 40rpx;
}

.plan-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.plan-item {
  position: relative;
  padding: 32rpx 24rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  &.selected {
    background: #fff5f0;
    border-color: #FF5F15;
  }

  &:active {
    transform: scale(0.98);
  }
}

.plan-points {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.plan-price {
  font-size: 36rpx;
  font-weight: bold;
  color: #FF5F15;
}

.plan-original {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
  margin-top: 8rpx;
}

.agreement-tip {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  margin-bottom: 32rpx;
}

.agreement-link {
  color: #FF5F15;
}

.confirm-btn {
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border: none;
}
</style>
