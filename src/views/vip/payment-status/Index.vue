<template>
  <div class="payment-container">
    <CustomNav title="" transparent :show-back="true" :show-home="false" />

    <div class="content-container">
      <div class="payment-card blur-glass">
        <van-loading
          v-if="paymentStatus === 0"
          color="var(--magic-color)"
          size="80rpx"
          class="payment-icon"
        />
        <img
          v-else-if="paymentStatus === 1"
          class="payment-icon"
          src="/static/payment/pay_success.png"
          alt=""
        />
        <van-icon
          v-else-if="paymentStatus === 2"
          name="close-circle"
          size="80rpx"
          color="#f87171"
          class="payment-icon"
        />

        <div class="payment-title">
          {{ paymentStatus === 1 ? '支付成功' : paymentStatus === 2 ? '支付失败' : '结果查询中' }}
        </div>
        <div v-if="paymentStatus === 1" class="payment-message">恭喜您！成为尊贵的会员</div>
      </div>

      <div v-if="paymentStatus === 1" class="home-button" @click="goBack">继续体验</div>
      <div v-else-if="paymentStatus === 2" class="home-button" @click="goBack">返回上一页</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { queryOrderStatus } from '@/api/order'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const paymentStatus = ref(0) // 0 支付中 1 支付成功 2 支付失败
let pollTimer = null

async function checkPaymentStatus() {
  const orderNumber = route.query.orderNumber
  if (!orderNumber) return
  try {
    const res = await queryOrderStatus(orderNumber)
    handlePaymentResponse(res)
  } catch (e) {
    // ignore error
  }
}

function handlePaymentResponse(response) {
  if (response === 1) {
    stopPolling()
    userStore.refreshVipInfo()
    paymentStatus.value = 1
  } else if (response === 2) {
    stopPolling()
    paymentStatus.value = 2
  }
}

function startPolling() {
  stopPolling()
  paymentStatus.value = 0
  pollTimer = setInterval(checkPaymentStatus, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.replace('/pages/home/home')
}

onMounted(() => {
  const orderNumber = route.query.orderNumber
  if (orderNumber) {
    startPolling()
  } else {
    showToast('缺少订单信息')
  }
})

onUnmounted(stopPolling)
</script>

<style lang="scss" scoped>
.payment-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #1a1a20;
  color: #fff;
  padding-top: 88rpx;
  box-sizing: border-box;
}

.content-container {
  padding: 64rpx 32rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.payment-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 64rpx 32rpx;
  text-align: center;
  margin-bottom: 32rpx;
}

.payment-icon {
  width: 80rpx;
  height: 80rpx;
  margin: 0 auto 32rpx;
}

.payment-title {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.payment-message {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

.home-button {
  width: 100%;
  height: 88rpx;
  background-color: #000;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  text-align: center;
  line-height: 88rpx;
}
</style>
