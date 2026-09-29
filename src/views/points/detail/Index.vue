<template>
  <div class="detail-page">
    <CustomNav transparent :show-back="true" :show-home="false" :show-left-logo="false" />

    <div class="detail-header">
      <span class="detail-title">积分明细</span>
      <div class="filter-dropdown" @click="toggleDropdown">
        <span class="filter-text">{{ filterOptions[filterIndex].label }}</span>
        <van-icon name="arrow-down" size="14" color="#fff" />
      </div>
    </div>

    <div v-if="showDropdown" class="dropdown-mask" @click="closeDropdown"></div>
    <div class="dropdown-menu" :class="{ show: showDropdown }">
      <div
        v-for="(item, idx) in filterOptions"
        :key="item.value"
        class="dropdown-item"
        :class="{ active: filterIndex === idx }"
        @click="selectFilter(idx)"
      >
        {{ item.label }}
      </div>
    </div>

    <div class="detail-list">
      <div
        v-for="(item, idx) in list"
        :key="item.id || idx"
        class="detail-item"
        @click="onItemTap(item)"
      >
        <div class="item-left">
          <div class="item-title-row">
            <span v-if="item.characterName" class="item-title">{{ item.characterName }}</span>
            <span v-else-if="item.changeType == 1 && item.sourceType == 1" class="item-title">积分充值</span>
            <span v-else-if="item.changeType == 1 && item.sourceType == 2" class="item-title">会员赠送</span>
            <span v-else-if="item.changeType == 1 && item.sourceType == 4" class="item-title">日积分发放</span>
            <span v-else-if="item.sourceType == 5" class="item-title">日积分过期</span>
            <span v-else-if="item.changeType == 1 && item.sourceType == 6" class="item-title">邀请码赠送</span>
            <span v-else-if="item.sourceType == 7" class="item-title">活跃用户奖励</span>
            <span v-else-if="item.sourceType == 8" class="item-title">深度用户奖励</span>
            <span v-else-if="item.sourceType == 9" class="item-title">邀请用户充值奖励</span>
            <span v-else-if="item.sourceType == 11" class="item-title">活动赠送</span>
            <span v-else class="item-title">{{ item.title || item.description || '积分变动' }}</span>
          </div>
          <span class="item-date">{{ item.formattedTime }}</span>
        </div>
        <div class="item-right">
          <span v-if="item.characterName" class="amount-mark">总</span>
          <span class="item-points">
            {{ item.changeType == 1 ? '+' : '-' }}{{ Math.abs(item.changeAmount) }}
          </span>
        </div>
      </div>

      <div v-if="loading" class="loading-more">加载中...</div>
      <div v-if="noMore && list.length > 0" class="no-more">没有更多了</div>
      <div v-if="list.length === 0 && !loading" class="empty-list">暂无记录</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import CustomNav from '@/components/CustomNav.vue'
import { getMyPointDetails } from '@/api/vip'
import { formatTime } from '@/utils/util'

const router = useRouter()

const filterOptions = [
  { label: '全部', value: '' },
  { label: '收入', value: '1' },
  { label: '支出', value: '2' }
]
const filterIndex = ref(0)
const changeType = ref('')
const showDropdown = ref(false)

const list = ref([])
const loading = ref(false)
const noMore = ref(false)
const current = ref(1)
const size = 20

async function loadData() {
  loading.value = true
  try {
    const res = await getMyPointDetails({
      current: current.value,
      size,
      changeType: changeType.value
    })
    const { records = [], pages = 0, current: cur = 1 } = res
    const arr = (records || []).map((item) => ({
      ...item,
      formattedTime: item.createTime ? formatTime(item.createTime, 'YYYY.MM.DD HH:mm') : ''
    }))
    list.value = current.value === 1 ? arr : [...list.value, ...arr]
    noMore.value = cur >= pages
  } catch (e) {
    console.error('loadData failed', e)
  } finally {
    loading.value = false
  }
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  showDropdown.value = false
}

function selectFilter(idx) {
  filterIndex.value = idx
  showDropdown.value = false
  changeType.value = filterOptions[idx].value
  current.value = 1
  list.value = []
  noMore.value = false
  loadData()
}

function onItemTap(item) {
  if (item.characterId) {
    router.push(
      `/pages/points/role-detail/index?roleId=${item.characterId}&roleName=${encodeURIComponent(item.characterName || '')}&dialogCount=${item.dialogCount || 0}`
    )
  }
}

function onScroll(e) {
  const el = e.target
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
    if (!loading.value && !noMore.value) {
      current.value += 1
      loadData()
    }
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('scroll', onScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #111827 0%, #050010 40%, #050010 100%);
  color: #fff;
  padding-bottom: var(--safearea-bottom);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 88rpx 32rpx 24rpx;
  position: relative;
  z-index: 10;
}

.detail-title {
  font-size: 32rpx;
  font-weight: 600;
}

.filter-dropdown {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 16rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  cursor: pointer;
}

.filter-text {
  font-size: 26rpx;
  color: #fff;
}

.dropdown-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 5;
}

.dropdown-menu {
  position: absolute;
  top: 110rpx;
  right: 32rpx;
  background: rgba(30, 30, 50, 0.96);
  border-radius: 16rpx;
  padding: 16rpx 0;
  z-index: 10;
  display: none;
  min-width: 200rpx;

  &.show {
    display: block;
  }
}

.dropdown-item {
  padding: 16rpx 32rpx;
  font-size: 28rpx;
  color: #fff;

  &.active {
    color: #a855f7;
    background: rgba(168, 85, 247, 0.1);
  }
}

.detail-list {
  padding: 0 32rpx;
  min-height: calc(100vh - 200rpx);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.item-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  margin-right: 8rpx;
}

.item-date {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.item-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.amount-mark {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
}

.item-points {
  font-size: 32rpx;
  font-weight: bold;
  color: #fbbf24;
}

.loading-more,
.no-more,
.empty-list {
  text-align: center;
  padding: 32rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>
