<template>
  <div class="points-page">
    <CustomNav transparent :show-back="true" :show-home="false" :show-left-logo="false">
      <template #center>
        <span class="nav-title">我的积分</span>
      </template>
    </CustomNav>

    <div class="points-content">
      <div class="points-header">
        <div class="points-header-title">我的积分</div>
        <div class="points-header-link" @click="goDetail">
          收支明细
          <van-icon name="arrow" size="14" />
        </div>
      </div>

      <div class="points-summary-card">
        <div class="points-summary-left">
          <img class="points-summary-icon" src="/static/vip/score.png" alt="" />
          <div class="points-summary-info">
            <div class="points-summary-value">{{ totalPoints }}</div>
          </div>
        </div>
      </div>

      <div class="section-title">积分获取方式</div>

      <div class="point-items">
        <div v-if="!isIos" class="point-item" @click="pointCharge">
          <div class="point-item-header">
            充值积分
            <div class="point-item-header-right">
              去充值 <van-icon name="arrow" size="14" />
            </div>
          </div>
          <div class="point-item-desc">积分充值，超划算~</div>
        </div>

        <div v-if="!isIos" class="point-item" @click="vipCharge">
          <div class="point-item-header">
            开通会员
            <div class="point-item-header-right">
              去开通 <van-icon name="arrow" size="14" />
            </div>
          </div>
          <div class="point-item-desc">
            开会员直接<span class="point-item-desc-white">送积分</span>！还有
            <span class="point-item-desc-white">一堆福利</span>等你来薅！
          </div>
        </div>

        <div class="point-item" @click="adReward">
          <div class="point-item-header">
            看广告赚积分
            <div class="point-item-header-right">
              去赚积分 <van-icon name="arrow" size="14" />
            </div>
          </div>
          <div class="point-item-desc">
            观看广告<span class="point-item-desc-white">赚积分</span>！每次
            <span class="point-item-desc-white">10积分</span>等你来赚！
          </div>
        </div>

        <div class="point-item" @click="invite">
          <div class="point-item-header">
            <div class="point-item-title">
              邀请好友赚积分
              <span class="point-item-title-tag gn">不限次</span>
            </div>
            <div class="point-item-header-right">
              去邀请 <van-icon name="arrow" size="14" />
            </div>
          </div>
          <div class="point-item-desc">邀新福利来啦！好友充值，你赚积分！</div>
        </div>

        <div class="point-item" @click="author">
          <div class="point-item-header">
            <div class="point-item-title">
              创作者激励活动
              <span class="point-item-title-tag rd">超火热</span>
            </div>
            <div class="point-item-header-right">
              查看活动 <van-icon name="arrow" size="14" />
            </div>
          </div>
          <div class="point-item-desc">
            创作爆款智能体，<span class="point-item-desc-white">超值积分</span>轻松赚！
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const pointInfo = computed(() => userStore.pointInfo || {})
const totalPoints = computed(() => {
  const pb = Number(pointInfo.value.pointBalance || 0)
  const df = Number(pointInfo.value.dailyFreeBalance || 0)
  return pb + df
})

const isIos = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
})

function goDetail() {
  router.push('/pages/points/detail/index')
}

function pointCharge() {
  showToast('敬请期待')
}

function vipCharge() {
  router.push('/pages/vip/packages/index')
}

function adReward() {
  showToast('敬请期待')
}

function invite() {
  router.push('/pages/share/index')
}

function author() {
  showToast('敬请期待')
}
</script>

<style lang="scss" scoped>
.points-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #111827 0%, #050010 40%, #050010 100%);
  color: #fff;
  padding-bottom: var(--safearea-bottom);
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
}

.points-content {
  padding: 88rpx 32rpx 32rpx;
  box-sizing: border-box;
  flex: 1;
  overflow-y: auto;
}

.points-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24rpx 0;
}

.points-header-title {
  font-size: 32rpx;
  font-weight: 600;
}

.points-header-link {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);

  text {
    margin-right: 4rpx;
  }
}

.points-summary-card {
  background: #111827;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  display: flex;
  align-items: center;
  margin: 24rpx 0;
}

.points-summary-left {
  display: flex;
  align-items: flex-start;
}

.points-summary-icon {
  width: 60rpx;
  height: 60rpx;
  margin-right: 6rpx;
}

.points-summary-info {
  display: flex;
  flex-direction: column;
}

.points-summary-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #a855f7;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin: 24rpx 0;
}

.point-items {
  display: flex;
  flex-direction: column;
}

.point-item {
  background: #111827;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
  cursor: pointer;
}

.point-item-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  color: #ddd;
  font-size: 28rpx;
  margin-bottom: 8rpx;
}

.point-item-title {
  display: flex;
  align-items: center;
}

.point-item-title-tag {
  border-radius: 6rpx;
  padding: 6rpx 8rpx;
  margin-left: 8rpx;
  font-size: 22rpx;
}

.point-item-title-tag.gn {
  background: rgb(223, 243, 223);
  color: rgb(8, 196, 8);
}

.point-item-title-tag.rd {
  background: rgb(236, 199, 199);
  color: rgb(230, 72, 72);
}

.point-item-header-right {
  color: #a855f7;
  display: flex;
  align-items: center;
  font-weight: normal;
  font-size: 24rpx;
}

.point-item-desc {
  color: #bbb;
  margin-top: 12rpx;
  font-size: 24rpx;
}

.point-item-desc-white {
  color: #fff;
  font-weight: bold;
}
</style>
