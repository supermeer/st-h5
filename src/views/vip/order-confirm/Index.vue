<template>
  <div class="order-container" :style="pageStyle">
    <CustomNav title="订单确认" transparent :show-back="true" :show-home="false" />

    <div class="content-container">
      <!-- 商品信息卡片 -->
      <div class="product-card" :style="productStyle">
        <div class="product-info">商品信息</div>
        <div class="product-price-line">
          <div class="product-name">{{ packageData.title }}</div>
          <div class="product-price">
            <div>优惠后</div>
            <div class="price-value">{{ packageData.amountInYuan }}</div>
          </div>
        </div>
        <div class="original-price">{{ packageData.originAmountInYuan }}</div>
        <div class="bottom-line">
          <img class="vip-icon" src="/static/vip/vip.png" alt="" />
          <div class="quantity-control">
            <div
              class="quantity-btn quantity-btn-minus"
              :class="{ disabled: quantity <= 1 }"
              @click="decreaseQuantity"
            >-</div>
            <div class="quantity-value">{{ quantity }}</div>
            <div
              class="quantity-btn quantity-btn-plus"
              :class="{ disabled: quantity >= maxQuantity }"
              @click="increaseQuantity"
            >+</div>
          </div>
        </div>
      </div>

      <!-- 价格明细 -->
      <div class="price-card blur-glass">
        <div class="price-info">价格明细</div>
        <div class="price-item">
          <span class="price-item-label">总价</span>
          <span class="price-item-value">{{ totalPrice }}</span>
        </div>
        <div class="price-item">
          <span class="price-item-label">优惠</span>
          <span class="price-item-value price-item-value-discount">-{{ discountPrice }}</span>
        </div>
        <div class="price-item total">
          <span class="price-item-label">合计</span>
          <span class="price-item-value">{{ finalPrice }}</span>
        </div>
      </div>

      <!-- 下单按钮 -->
      <div class="order-button" @click="submitOrder">立即下单</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'

const route = useRoute()
const router = useRouter()

const packageData = ref({
  title: '',
  amountInYuan: '0',
  originAmountInYuan: '0'
})
const quantity = ref(1)
const maxQuantity = ref(99)

const pageStyle = {
  backgroundImage:
    'url(https://yoursx-static-1371529546.cos.ap-guangzhou.myqcloud.com/page_bg_1.png)',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundColor: '#1a1a20',
  minHeight: '100vh'
}

const productStyle = {
  backgroundImage:
    'url(https://yoursx-static-1371529546.cos.ap-guangzhou.myqcloud.com/vip.png)',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
}

const totalPrice = computed(() => {
  const v = Number(packageData.value.amountInYuan || 0) * quantity.value
  return v.toFixed(2)
})

const discountPrice = computed(() => {
  const origin = Number(packageData.value.originAmountInYuan || 0) * quantity.value
  return (origin - Number(totalPrice.value)).toFixed(2)
})

const finalPrice = computed(() => totalPrice.value)

function decreaseQuantity() {
  if (quantity.value > 1) quantity.value -= 1
}

function increaseQuantity() {
  if (quantity.value < maxQuantity.value) quantity.value += 1
}

function submitOrder() {
  showToast('请前往会员套餐页支付')
  setTimeout(() => router.replace('/pages/vip/packages/index'), 500)
}

onMounted(() => {
  // 从路由 query 读取数据
  if (route.query.title) packageData.value.title = String(route.query.title)
  if (route.query.amountInYuan) {
    packageData.value.amountInYuan = String(route.query.amountInYuan)
  }
  if (route.query.originAmountInYuan) {
    packageData.value.originAmountInYuan = String(route.query.originAmountInYuan)
  }
  if (route.query.quantity) quantity.value = Number(route.query.quantity) || 1
})
</script>

<style lang="scss" scoped>
.order-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding-top: 88rpx;
  box-sizing: border-box;
  color: #fff;
}

.content-container {
  padding: 32rpx;
  box-sizing: border-box;
}

.product-card {
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  color: #fff;
  min-height: 320rpx;
}

.product-info {
  font-size: 28rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24rpx;
}

.product-price-line {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.product-name {
  font-size: 40rpx;
  font-weight: bold;
  flex: 1;
}

.product-price {
  text-align: right;
  font-size: 24rpx;
}

.price-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #ffd54a;
  line-height: 1.1;
}

.original-price {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: line-through;
  text-align: right;
  margin-top: 4rpx;
}

.bottom-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 32rpx;
}

.vip-icon {
  width: 56rpx;
  height: 56rpx;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.quantity-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

.quantity-value {
  min-width: 56rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
}

.price-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  color: #fff;
}

.price-info {
  font-size: 28rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24rpx;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  font-size: 28rpx;
}

.price-item-label {
  color: rgba(255, 255, 255, 0.85);
}

.price-item-value {
  font-weight: 600;
  color: #fff;
}

.price-item-value-discount {
  color: #ffd54a;
}

.price-item.total {
  border-top: 1rpx solid rgba(255, 255, 255, 0.1);
  padding-top: 24rpx;
  margin-top: 8rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.order-button {
  width: 100%;
  height: 92rpx;
  background-color: #000;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  margin-top: 32rpx;
}
</style>
