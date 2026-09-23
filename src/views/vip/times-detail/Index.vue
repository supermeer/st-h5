<template>
  <div class="times-detail-container" :style="pageStyle">
    <CustomNav title="使用记录" transparent :show-back="true" :show-home="false" />

    <div class="content-container">
      <div v-if="list.length === 0" class="empty-block">
        <van-empty description="暂无使用记录" />
      </div>
      <div v-else class="times-list">
        <div v-for="(item, idx) in list" :key="idx" class="times-item blur-glass">
          <div class="left-content">
            <div class="left-content-title">{{ item.planTitle }}</div>
            <div
              v-if="item.startTime && item.endTime"
              class="left-content-time"
            >
              {{ item.startTime }} - {{ item.endTime }}{{ item.status === 0 ? '（待生效）' : '' }}
            </div>
            <div v-else class="left-content-time">永久有效</div>
          </div>
          <div class="right-content">
            剩余
            <div class="right-content-remain">{{ item.remaining }}次</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { getQuotaInfo } from '@/api/usercenter'
import { formatTime } from '@/utils/util'

const list = ref([])

const pageStyle = {
  backgroundImage:
    'url(https://yoursx-static-1371529546.cos.ap-guangzhou.myqcloud.com/page_bg_1.png)',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundColor: '#1a1a20',
  minHeight: '100vh'
}

async function fetchList() {
  try {
    const res = await getQuotaInfo()
    list.value = (res.monthlyCycles || []).map((item) => ({
      ...item,
      startTime: item.startTime ? formatTime(item.startTime, 'YYYY.MM.DD') : '',
      endTime: item.endTime ? formatTime(item.endTime, 'YYYY.MM.DD') : ''
    }))
  } catch (e) {
    console.warn('getQuotaInfo failed', e)
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.times-detail-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  color: #fff;
  padding-top: 88rpx;
  box-sizing: border-box;
}

.content-container {
  padding: 32rpx;
  box-sizing: border-box;
}

.empty-block {
  padding-top: 200rpx;
}

.empty-block :deep(.van-empty__description) {
  color: rgba(255, 255, 255, 0.6);
}

.times-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.times-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-content-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;
}

.left-content-time {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.right-content {
  text-align: right;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.right-content-remain {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffd54a;
  line-height: 1.2;
  margin-top: 4rpx;
}
</style>
