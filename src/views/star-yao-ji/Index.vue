<template>
  <div class="creator-page">
    <!-- 星空背景（金色光点） -->
    <div class="starry-bg">
      <div v-for="n in 30" :key="n" class="star-dot" :class="`star-dot-${n}`"></div>
    </div>

    <CustomNav :show-back="true" :show-left-logo="false" :show-home="false" :transparent="true">
      <template #center>星耀集</template>
    </CustomNav>

    <!-- 固定头部：用户卡 + 公告 + 三栏统计卡 -->
    <div class="creator-header" id="creator-header">
      <!-- 顶部用户信息卡（紫色渐变） -->
      <div class="user-card">
        <div class="user-card-avatar-wrapper">
          <img class="user-card-avatar" :src="userInfo.avatarUrl || '/static/usercenter/user_icon.png'" alt="" />
        </div>
        <div class="user-card-text">
          <div class="user-card-name">{{ userInfo.nickname || '小柚子' }}</div>
          <div v-if="userBadge.text" class="user-card-badge">
            <span class="user-card-badge-icon">{{ userBadge.icon || '⭐' }}</span>
            <span>{{ userBadge.text }}</span>
          </div>
        </div>
      </div>

      <!-- 公告行 -->
      <div v-if="announcementText" class="announcement-row" @click="onAnnouncementClick">
        <van-icon name="volume-o" color="#ffd54a" size="14" class="announcement-icon" />
        <span class="announcement-text">{{ announcementText }}</span>
        <van-icon name="arrow" color="#999" size="10" class="announcement-arr" />
      </div>

      <!-- 三栏统计卡 -->
      <div class="stat-grid">
        <div class="stat-card stat-card--role" @click="onStatCardClick('role')">
          <div class="stat-card-bg"></div>
          <div class="stat-card-content">
            <div class="stat-card-num">{{ stats.roleCount || 0 }}<span class="stat-card-unit">个</span></div>
            <div class="stat-card-label">我的智能体</div>
            <div class="stat-card-btn" @click.stop="onCreateRoleClick">创建</div>
          </div>
        </div>

        <div class="stat-card stat-card--group" @click="onStatCardClick('group')">
          <div class="stat-card-bg"></div>
          <div class="stat-card-content">
            <div class="stat-card-num">{{ stats.groupCount || 0 }}<span class="stat-card-unit">个</span></div>
            <div class="stat-card-label">我的群聊</div>
            <div class="stat-card-btn" @click.stop="onCreateGroupClick">创建</div>
          </div>
        </div>

        <div class="stat-card stat-card--income" @click="onStatCardClick('income')">
          <div class="stat-card-bg"></div>
          <div class="stat-card-content">
            <div class="stat-card-num stat-card-num--small">
              今日<span class="stat-card-income">+{{ stats.todayIncome || 0 }}</span>
            </div>
            <div class="stat-card-label">收益明细</div>
            <div class="stat-card-btn" @click.stop="onViewIncomeClick">查看</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可滚动内容 -->
    <div class="creator-scroll" ref="scrollRef" @scroll="onScroll">
      <!-- 我的收益 -->
      <div class="income-section">
        <div class="section-title">
          <div class="section-title-bar"></div>
          <span>我的收益</span>
        </div>
        <div class="income-grid">
          <div class="income-item">
            <div class="income-item-value">{{ income.characterIncome || 0 }}</div>
            <div class="income-item-label">智能体收益</div>
          </div>
          <div class="income-item">
            <div class="income-item-value">{{ income.groupIncome || 0 }}</div>
            <div class="income-item-label">群聊收益</div>
          </div>
          <div class="income-item">
            <div class="income-item-value">{{ income.fanCount || 0 }}</div>
            <div class="income-item-label">粉丝数（人）</div>
          </div>
        </div>
      </div>

      <!-- 我的战绩 -->
      <div class="achievement-section">
        <div class="section-title">
          <div class="section-title-bar"></div>
          <span>我的战绩</span>
        </div>

        <div class="achievement-summary">
          <div class="achievement-summary-row">
            <div class="achievement-summary-num">
              {{ publicRoleCount || 0 }}<span class="achievement-summary-unit">个</span>
            </div>
            <div class="achievement-summary-label">公开智能体</div>
          </div>
          <div class="achievement-summary-divider"></div>
          <div class="achievement-summary-row">
            <div class="achievement-summary-num">
              已打败 <span class="achievement-summary-percent">{{ beatPercent || 0 }}%</span>
            </div>
            <div class="achievement-summary-label">的星语造星师</div>
          </div>
        </div>

        <div v-if="roleAchievements.length > 0" class="role-achievement-list">
          <div
            v-for="item in roleAchievements"
            :key="item.id"
            class="role-achievement-item"
            @click="onAchievementClick(item)"
          >
            <img class="role-achievement-avatar" :src="item.backgroundImage || item.avatar || '/static/usercenter/user_icon.png'" alt="" />
            <div class="role-achievement-info">
              <div class="role-achievement-name">{{ item.name }}</div>
              <div v-if="item.tags && item.tags.length" class="role-achievement-tags">
                <span
                  v-for="(tag, idx) in item.tags"
                  :key="idx"
                  class="role-achievement-tag"
                >
                  <span class="role-achievement-tag-tick">✓</span>
                  <span>{{ tag }}</span>
                </span>
              </div>
            </div>
            <van-icon name="arrow" color="#666" size="14" class="role-achievement-arr" />
          </div>
        </div>

        <div v-else class="empty-state">
          <van-icon name="info-o" color="#666" size="40" />
          <div class="empty-text">暂无公开智能体</div>
          <div class="empty-btn" @click="onCreateRoleClick">创建智能体</div>
        </div>
      </div>

      <div :style="{ height: '120px' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { useUserStore } from '@/store/user'
import { getStarShowcase } from '@/api/usercenter'
import { getCurrentPlotByCharacterId } from '@/api/role'
import { getUserGroupChatList } from '@/api/group'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref({})
const userBadge = reactive({
  icon: '⭐',
  text: '群聊内测官'
})
const announcementText = ref('点击查看群聊内测官福利～')

const stats = reactive({
  roleCount: 0,
  groupCount: 0,
  todayIncome: 0
})

const income = reactive({
  characterIncome: 0,
  groupIncome: 0,
  fanCount: 0
})

const publicRoleCount = ref(0)
const beatPercent = ref(0)
const roleAchievements = ref([])

const scrollRef = ref(null)
let scrollHeight = 0

const MOCK_ROLE_ACHIEVEMENTS = [
  {
    id: 'r1',
    name: '时雾',
    backgroundImage: 'https://character-static-1371529546.cos.ap-guangzhou.myqcloud.com/background/f5c5b5ede5454926a873ae6b05342a89.jpg',
    tags: ['曾上榜 2025年6月「人气道」榜单']
  },
  {
    id: 'r2',
    name: '星辰大海',
    backgroundImage: 'https://character-static-1371529546.cos.ap-guangzhou.myqcloud.com/background/f5c5b5ede5454926a873ae6b05342a89.jpg',
    tags: ['曾上榜 2025年7月「灵感道」榜单']
  },
  {
    id: 'r3',
    name: '云端恋人',
    backgroundImage: 'https://character-static-1371529546.cos.ap-guangzhou.myqcloud.com/background/f5c5b5ede5454926a873ae6b05342a89.jpg',
    tags: []
  }
]

onMounted(() => {
  measureScrollHeight()
  loadAll()
})

function measureScrollHeight() {
  const windowHeight = window.innerHeight
  const navHeight = 88
  nextTick(() => {
    const header = document.getElementById('creator-header')
    const headerHeight = header ? header.offsetHeight : 0
    scrollHeight = Math.max(200, windowHeight - navHeight - headerHeight)
    if (scrollRef.value) {
      scrollRef.value.style.height = scrollHeight + 'px'
    }
  })
}

function loadAll() {
  loadUserInfo()
  loadStarShowcase()
  loadMyGroups()
}

function loadMyGroups() {
  const params = {
    current: 1,
    size: 100,
    ifSystem: false,
    creatorUserId: userStore.userInfo?.id
  }
  getUserGroupChatList(params).then((res) => {
    if (res && res.records) {
      stats.groupCount = res.records.length
    }
  }).catch(() => {})
}

async function loadStarShowcase() {
  try {
    const userId = userStore.userInfo?.id
    if (!userId) return
    await getStarShowcase({ userId })
  } catch (e) {
    console.warn('加载星耀展示失败', e)
  }
}

function loadUserInfo() {
  const info = userStore.userInfo || {}
  userInfo.value = info
}

function onAnnouncementClick() {
  showToast('公告详情，敬请期待')
}

function onStatCardClick(type) {
  if (type === 'role') {
    router.push('/pages/usercenter/index')
  } else if (type === 'group') {
    router.push('/pages/usercenter/index')
  } else if (type === 'income') {
    router.push('/pages/points/detail/index')
  }
}

function onCreateRoleClick() {
  router.push('/pages/role/add/index')
}

function onCreateGroupClick() {
  router.push('/pages/group/add/index')
}

function onViewIncomeClick() {
  router.push('/pages/points/detail/index')
}

async function onAchievementClick(item) {
  if (!item || !item.id) return
  try {
    const res = await getCurrentPlotByCharacterId(item.id)
    router.push({
      path: '/pages/chat/index',
      query: {
        plotId: res && res.plotId ? res.plotId : '',
        characterId: item.id
      }
    })
  } catch (e) {
    router.push({
      path: '/pages/chat/index',
      query: { characterId: item.id }
    })
  }
}

function onScroll() {
  // 滚动处理（暂不需要）
}

// 暴露成就数据（mock 展示）
setTimeout(() => {
  publicRoleCount.value = 3
  beatPercent.value = 65
  stats.roleCount = 3
  stats.todayIncome = 120
  income.characterIncome = 456
  income.groupIncome = 456
  income.fanCount = 78
  roleAchievements.value = MOCK_ROLE_ACHIEVEMENTS
}, 500)
</script>

<style lang="scss" scoped>
@use 'sass:math';
.creator-page {
  position: relative;
  min-height: 100vh;
  background: #0a0a14;
  color: #fff;
  padding-top: 88px;
  overflow: hidden;
}

/* 星空背景 */
.starry-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.star-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #FFD700;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
  animation: twinkle 3s ease-in-out infinite;
}

@for $i from 1 through 30 {
  .star-dot-#{$i} {
    top: math.percentage(math.div(math.random(100), 100));
    left: math.percentage(math.div(math.random(100), 100));
    animation-delay: math.div(math.random(30), 10) * 1s;
  }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.creator-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.creator-header {
  position: relative;
  z-index: 1;
  padding: 0 32px 32px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 24px;
  background: linear-gradient(135deg, #6d5cff 0%, #a98cff 100%);
  padding: 32px;
  border-radius: 24px;
  margin-bottom: 24px;
}

.user-card-avatar-wrapper {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.user-card-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-card-text {
  flex: 1;
}

.user-card-name {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.user-card-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  font-size: 22px;
  color: #FFD700;
}

.user-card-badge-icon {
  font-size: 22px;
}

.announcement-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  margin-bottom: 24px;
  cursor: pointer;
}

.announcement-text {
  flex: 1;
  font-size: 26px;
  color: rgba(255, 255, 255, 0.7);
}

.announcement-icon {
  flex-shrink: 0;
}

.announcement-arr {
  flex-shrink: 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.stat-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px 16px;
  cursor: pointer;
  overflow: hidden;
  min-height: 160px;
}

.stat-card-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%);
  z-index: 0;
}

.stat-card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-card-num {
  font-size: 40px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.stat-card-num--small {
  font-size: 28px;
}

.stat-card-unit {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.stat-card-income {
  font-weight: 700;
  color: #FFD700;
  font-size: 32px;
  margin-left: 4px;
}

.stat-card-label {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
}

.stat-card-btn {
  padding: 6px 16px;
  background: rgba(139, 92, 246, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.6);
  border-radius: 20px;
  font-size: 22px;
  color: #fff;
}

/* 滚动区 */
.creator-scroll {
  position: relative;
  z-index: 1;
  overflow-y: auto;
  padding: 0 32px;
}

.income-section,
.achievement-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 24px;
}

.section-title-bar {
  width: 6px;
  height: 28px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.income-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.income-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
}

.income-item-value {
  font-size: 40px;
  font-weight: 700;
  color: #FFD700;
  margin-bottom: 8px;
}

.income-item-label {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.7);
}

.achievement-summary {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
}

.achievement-summary-row {
  flex: 1;
  text-align: center;
}

.achievement-summary-num {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.achievement-summary-unit {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.achievement-summary-percent {
  color: #FFD700;
  font-size: 36px;
}

.achievement-summary-label {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.6);
}

.achievement-summary-divider {
  width: 1px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
}

.role-achievement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-achievement-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.role-achievement-avatar {
  width: 96px;
  height: 96px;
  border-radius: 16px;
  object-fit: cover;
  flex-shrink: 0;
}

.role-achievement-info {
  flex: 1;
  overflow: hidden;
}

.role-achievement-name {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
}

.role-achievement-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-achievement-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 22px;
  color: rgba(255, 255, 255, 0.6);
}

.role-achievement-tag-tick {
  color: #52C41A;
}

.role-achievement-arr {
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: rgba(255, 255, 255, 0.6);
}

.empty-text {
  font-size: 28px;
  margin: 12px 0 24px;
}

.empty-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 32px;
  font-size: 28px;
  color: #fff;
  cursor: pointer;
}
</style>
