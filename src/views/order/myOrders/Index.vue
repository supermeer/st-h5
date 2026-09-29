<template>
  <div class="orders-page">
    <CustomNav title="" :show-back="true" :show-home="false" />

    <div class="content-container">
      <!-- 顶部 tabs -->
      <div class="order-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.value"
          class="order-tab"
          :class="{ active: activeTab === tab.value }"
          @click="onTabChange(tab.value)"
        >
          {{ tab.label }}
        </div>
      </div>

      <!-- 订单列表 -->
      <div class="order-list-refresh" v-if="!loading && orderList.length > 0">
        <div class="order-list">
          <div
            v-for="order in orderList"
            :key="order.id"
            class="order-item blur-glass"
            @click="onOrderClick(order)"
          >
            <div class="order-header">订单编号：{{ order.orderNumber }}</div>
            <div class="order-goods">
              <div class="order-goods-name">{{ order.title }}</div>
              <div class="order-goods-count">x{{ order.count }}</div>
              <div class="order-goods-price">
                {{ order.totalAmount ? '¥' + order.totalAmount : '赠送' }}
              </div>
            </div>
            <div class="order-footer">
              <div class="order-time">{{ order.createTime }}</div>
              <div
                v-if="order.orderType === 301"
                class="order-status"
              >
                赠送成功
              </div>
              <div
                v-else
                class="order-status"
                :class="{ 'order-status-error': order.orderStatus === 2 }"
              >
                支付{{ order.orderStatus === 0 ? '中' : order.orderStatus === 1 ? '成功' : '失败' }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasMore" class="load-more" @click="onLoadMore">
          {{ loadMoreStatus === 1 ? '加载中...' : '加载更多' }}
        </div>
        <div v-else class="no-more">没有更多了</div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-container">
        <img class="empty-image" src="/static/images/empty-data.png" alt="" />
        <div class="empty-text">暂无订单</div>
      </div>

      <!-- 加载中 -->
      <div v-else class="loading-state">
        <van-loading color="#FF5F15">加载中...</van-loading>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CustomNav from '@/components/CustomNav.vue'
import { getOrderList } from '@/api/order'

const tabs = [
  { label: '全部', value: 'all' },
  { label: '支付中', value: '0' },
  { label: '完成', value: '1' },
  { label: '失败', value: '2' }
]
const activeTab = ref('all')

const orderList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const loadMoreStatus = ref(0) // 0 default, 1 loading, 2 no more, 3 failed

function formatDate(time) {
  const date = new Date(time)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

async function fetchOrders(isReset = false) {
  if (isReset) {
    page.value = 1
    orderList.value = []
    hasMore.value = true
    loadMoreStatus.value = 0
  }
  if (!hasMore.value && !isReset) return

  loadMoreStatus.value = 1
  loading.value = isReset

  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (activeTab.value !== 'all') params.orderStatus = activeTab.value
    const list = await getOrderList(params)
    const arr = (list || []).map((it) => ({
      ...it,
      createTime: formatDate(it.createTime)
    }))
    orderList.value = isReset ? arr : [...orderList.value, ...arr]
    hasMore.value = arr.length === pageSize.value
    loadMoreStatus.value = hasMore.value ? 0 : 2
    page.value += 1
  } catch (e) {
    console.error('getOrderList failed', e)
    loadMoreStatus.value = 3
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onTabChange(value) {
  activeTab.value = value
  fetchOrders(true)
}

function onLoadMore() {
  if (loadMoreStatus.value === 0) fetchOrders()
}

function onOrderClick(order) {
  console.log('order clicked', order)
}

function onRefresh() {
  if (refreshing.value) return
  refreshing.value = true
  fetchOrders(true)
}

onMounted(() => {
  fetchOrders(true)
})
</script>

<style lang="scss" scoped>
.orders-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #121212 0%, #252525 50%, #252525 100%);
  color: #fff;
  padding-bottom: calc(32rpx + var(--safearea-bottom));
}

.content-container {
  padding: 88rpx 0 0;
  box-sizing: border-box;
}

.order-tabs {
  display: flex;
  padding: 0 32rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin: 16rpx 24rpx;
}

.order-tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  position: relative;
  cursor: pointer;

  &.active {
    color: #fff;
    font-weight: bold;

    &::after {
      content: '';
      position: absolute;
      bottom: 8rpx;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 6rpx;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 3rpx;
    }
  }
}

.order-list {
  padding: 0 24rpx;
}

.order-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  cursor: pointer;
  transition: transform 0.15s;

  &:active {
    transform: scale(0.98);
  }
}

.order-header {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16rpx;
}

.order-goods {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.order-goods-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-goods-count {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-right: 16rpx;
}

.order-goods-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #FFD700;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.order-status {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: rgba(108, 92, 231, 0.2);
  color: var(--theme-color-purple);
  font-weight: bold;
}

.order-status-error {
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 32rpx;
  color: rgba(255, 255, 255, 0.4);
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  opacity: 0.5;
}

.empty-text {
  margin-top: 24rpx;
  font-size: 28rpx;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.load-more {
  text-align: center;
  padding: 32rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.no-more {
  text-align: center;
  padding: 32rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
}
</style>
