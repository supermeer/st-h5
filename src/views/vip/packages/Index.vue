<template>
  <div class="packages-page" v-if="show">
    <CustomNav title="" transparent :show-back="true" :show-home="false" />

    <div class="scroll-content" ref="scrollRef">
      <!-- 会员权益卡片 -->
      <div class="benefits-card blur-glass">
        <div class="benefits-title">开通会员，解锁高级权益</div>
        <div class="benefits-list">
          <span class="benefit-item">会员不支持无限畅聊，</span>
          <span class="benefit-item">仔细查看权益后，</span>
          <span class="benefit-item">再进行购买</span>
        </div>
      </div>

      <!-- 功能对比表格 -->
      <div class="comparison-table blur-glass">
        <div class="member-bg blur-glass" />
        <div class="table-header">
          <div class="header-cell header-label">
            <span class="header-text">权益</span>
          </div>
          <div class="header-cell header-current">
            <img v-if="userInfo?.avatarUrl" class="user-avatar" :src="userInfo.avatarUrl" alt="" />
            <span class="header-text">当前</span>
          </div>
          <div class="header-cell header-member">
            <span class="header-text">会员</span>
          </div>
        </div>
        <div class="table-body">
          <div
            v-for="(item, idx) in selectedPackage.benefitInfo"
            :key="idx"
            class="table-row"
          >
            <div class="table-cell cell-label">{{ item.name }}</div>
            <div class="table-cell cell-value">{{ item.normal }}</div>
            <div class="table-cell cell-value cell-member">{{ item.vip }}</div>
          </div>
        </div>
      </div>

      <!-- 规则说明 -->
      <div class="rule-info">
        <div class="rule-info-title">规则说明</div>
        <div class="rule-info-item">1、一次可购买多个会员，有效期自动顺延。</div>
        <div class="rule-info-item">2、赠送积分，支付完成后，立即到账，无需等会员生效。</div>
        <div class="rule-info-item">3、支付成功后，不支持退款。</div>
        <div class="rule-info-item">
          4、<span class="warn">对话需要消耗积分，会员权益不包含无限对话。</span>
        </div>
      </div>
    </div>

    <!-- 底部套餐选择 + 购买 -->
    <div class="bottom-container">
      <div v-if="isSpringFestival" class="activity-tip">新年特惠，限时折扣</div>
      <div class="package-selection">
        <div
          v-for="item in packages"
          :key="item.id"
          class="package-card blur-glass"
          :class="{ 'package-card-selected': selectedPackage && selectedPackage.id === item.id }"
          @click="onSelectPackage(item)"
        >
          <div v-if="item.discountInfo" class="discount-info" v-html="item.discountInfo"></div>
          <div class="package-price-text">¥{{ item.amountInYuan }}</div>
          <div class="package-name-text">{{ item.title }}</div>
        </div>
      </div>
      <div class="purchase-button" @click="onPurchase">
        <span class="purchase-price">¥{{ selectedPackage ? selectedPackage.amountInYuan : '0' }}</span>
        <span class="purchase-text">立即购买</span>
      </div>
      <div class="agreement-text">
        <span>开通,即表示阅读并同意</span>
        <span class="agreement-link" @click="onServiceAgreement">《会员服务协议》</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { getPricingPlan } from '@/api/order'
import { isSpringFestivalExpired } from '@/api/usercenter'
import { createOrderAndPrepay } from '@/api/order'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const show = ref(true)
const packages = ref([])
const selectedPackage = ref(null)
const isSpringFestival = ref(false)
const paying = ref(false)

const userInfo = computed(() => userStore.userInfo || {})

async function fetchPackages() {
  try {
    const list = await getPricingPlan({ type: 0 })
    const arr = (list || []).map((item) => ({
      ...item,
      benefitInfo: safeJsonParse(item.benefitInfo, []),
      amountInYuan: ((item.amountInFen || 0) / 100).toFixed(2)
    }))
    packages.value = arr
    if (arr.length) selectedPackage.value = arr[0]
  } catch (e) {
    console.warn('getPricingPlan failed', e)
  }
}

async function fetchSpringFestival() {
  try {
    const expired = await isSpringFestivalExpired()
    isSpringFestival.value = !expired
  } catch (e) {
    console.warn('isSpringFestivalExpired failed', e)
  }
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return fallback
  }
}

function onSelectPackage(item) {
  selectedPackage.value = item
}

async function onPurchase() {
  if (paying.value) return
  if (!selectedPackage.value) {
    showToast('请选择套餐')
    return
  }
  paying.value = true
  try {
    const openId = localStorage.getItem('openId') || ''
    const res = await createOrderAndPrepay({
      openId,
      orderType: selectedPackage.value.orderType,
      count: 1
    })
    // H5 暂不支持微信支付，跳转到支付状态页模拟
    router.push(`/pages/vip/payment-status/index?orderNumber=${res.orderNumber || ''}`)
  } catch (e) {
    showToast(e?.msg || '支付失败')
  } finally {
    paying.value = false
  }
}

function onServiceAgreement() {
  router.push('/pages/common/agreement/index?type=1')
}

onMounted(() => {
  // aE = '0' 表示审核模式，隐藏内容
  const ev = localStorage.getItem('aE')
  if (ev === '0') show.value = false
  fetchPackages()
  fetchSpringFestival()
})
</script>

<style lang="scss" scoped>
.packages-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #000;
  color: #fff;
}

.scroll-content {
  position: relative;
  width: 100%;
  z-index: 1;
  padding: 88rpx 32rpx 500rpx;
  box-sizing: border-box;
}

/* 会员权益卡片 */
.benefits-card {
  margin-bottom: 32rpx;
  padding: 40rpx 48rpx;
  border-radius: 40rpx;
  color: #fff;
  background: linear-gradient(135deg, rgba(211, 211, 211, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%);
}

.benefits-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 24rpx;
  line-height: 1.4;
}

.benefit-item {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  display: inline-block;
  margin-right: 16rpx;
}

/* 功能对比表格 */
.comparison-table {
  margin-bottom: 32rpx;
  padding: 32rpx;
  border-radius: 24rpx;
  color: #fff;
  position: relative;
  background: rgba(255, 255, 255, 0.05);
}

.member-bg {
  position: absolute;
  top: 32rpx;
  right: 32rpx;
  bottom: 32rpx;
  border-radius: 24rpx;
  width: 120rpx;
  z-index: -1;
  background: #fff;
}

.table-header {
  display: flex;
  align-items: center;
  margin-bottom: 60rpx;
}

.header-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.header-label {
  align-items: flex-start;
  flex: 1;
}

.header-current {
  width: 100rpx;
  position: relative;
  align-items: center;
}

.user-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-bottom: 8rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  display: block;
}

.header-member {
  width: 120rpx;
  border-radius: 12rpx;
  padding: 12rpx 0;
  font-weight: bold;
  background: linear-gradient(135deg, #ffd54a 0%, #ff8a3d 100%);
  color: #5a1a00;
}

.header-text {
  font-size: 24rpx;
  color: #fff;
}

.table-body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.table-row {
  display: flex;
  align-items: center;
  padding-bottom: 24rpx;
}

.table-cell {
  font-size: 28rpx;
  color: #fff;
  text-align: center;
}

.cell-label {
  text-align: left;
  color: rgba(255, 255, 255, 0.8);
  flex: 1;
}

.cell-value {
  color: #fff;
  width: 100rpx;
}

.cell-member {
  color: #ffd54a;
  font-weight: bold;
  width: 120rpx;
}

.rule-info {
  color: #ddd;
  padding: 12rpx;
  font-weight: bold;
}

.rule-info-title {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.rule-info-item {
  font-size: 24rpx;
  margin-top: 4rpx;
}

.rule-info-item .warn {
  color: #f00;
}

.bottom-container {
  z-index: 100;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 42rpx 32rpx 32rpx;
  box-sizing: border-box;
  background: #fff;
  border-radius: 42rpx 42rpx 0 0;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.activity-tip {
  background: #d81e06;
  color: #fff;
  display: inline-block;
  padding: 4rpx 10rpx;
  border-bottom-left-radius: 16rpx;
  border-top-right-radius: 16rpx;
  position: absolute;
  top: 0;
  left: 40rpx;
  transform: translateY(-50%);
  font-size: 24rpx;
}

.package-selection {
  margin-bottom: 32rpx;
  width: 100%;
  white-space: nowrap;
  overflow-x: auto;
  gap: 16rpx;
  display: flex;
}

.package-card {
  display: inline-flex;
  vertical-align: top;
  background-color: rgba(245, 245, 245, 1);
  border-radius: 24rpx;
  padding: 52rpx 20rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 160rpx;
  box-sizing: border-box;
  width: 30%;
  margin-right: 16rpx;
  flex-shrink: 0;
  cursor: pointer;
}

.package-card-selected {
  background-color: #fff;
  border: 2rpx solid #6c5ce7;
}

.discount-info {
  font-size: 20rpx;
  color: #d81e06;
}

.package-price-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #000;
  margin-bottom: 12rpx;
}

.package-name-text {
  font-size: 24rpx;
  color: rgba(0, 0, 0, 0.6);
}

.purchase-button {
  width: 100%;
  height: 92rpx;
  background-color: #000;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  cursor: pointer;
}

.purchase-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.purchase-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.agreement-text {
  font-size: 24rpx;
  color: #000;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 40rpx;
}

.agreement-link {
  color: #000;
  text-decoration: underline;
}
</style>
