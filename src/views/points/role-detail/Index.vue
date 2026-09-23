<template>
  <div class="role-detail-page">
    <CustomNav transparent :show-back="true" :show-home="false" :show-left-logo="false" />

    <div class="role-header">
      <img
        class="role-avatar"
        :src="roleInfo.avatar || '/static/chat/default_avatar.png'"
        alt=""
      />
      <div class="role-info">
        <span class="role-name">{{ roleInfo.name }}</span>
        <span class="role-dialog-count">对话数：{{ roleInfo.dialogCount }}条</span>
      </div>
    </div>

    <div class="consume-list">
      <div v-for="item in consumeList" :key="item.id" class="consume-item">
        <div class="consume-left">
          <div class="consume-title-row">
            <span class="consume-title">对话消耗</span>
            <span class="consume-count">+1</span>
          </div>
          <span class="consume-date">{{ item.date }}</span>
        </div>
        <div class="consume-right">
          <span class="consume-points">-{{ item.changeAmount }}</span>
          <span v-if="item.originalAmount" class="consume-points__origin">
            -{{ item.originalAmount }}
          </span>
        </div>
      </div>

      <div v-if="loading" class="loading-more">加载中...</div>
      <div v-if="noMore && consumeList.length > 0" class="no-more">没有更多了</div>
      <div v-if="consumeList.length === 0 && !loading" class="empty-list">暂无消耗记录</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { getCharacterPointDetail } from '@/api/vip'
import { formatTime } from '@/utils/util'

const route = useRoute()

const roleInfo = ref({ roleId: '', name: '', avatar: '', dialogCount: 0 })
const consumeList = ref([])
const loading = ref(false)
const noMore = ref(false)
const page = ref(1)
const pageSize = 20

async function loadData(p = page.value) {
  if (!roleInfo.value.roleId) return
  const shouldReset = p === 1
  if (shouldReset) {
    consumeList.value = []
    noMore.value = false
  }
  loading.value = true
  try {
    const res = await getCharacterPointDetail({
      characterId: roleInfo.value.roleId,
      current: p,
      size: pageSize
    })
    const { records = [], current = p, pages = 1, total = 0 } = res
    const arr = (records || []).map((item) => ({
      ...item,
      date: item.createTime ? formatTime(item.createTime, 'YYYY.MM.DD HH:mm') : ''
    }))
    consumeList.value = shouldReset ? arr : [...consumeList.value, ...arr]
    noMore.value = current >= pages

    const latest = records[0] || {}
    roleInfo.value = {
      ...roleInfo.value,
      name: latest.characterName,
      avatar: latest.backgroundImage,
      dialogCount: total
    }
    page.value = current
  } catch (e) {
    showToast(typeof e === 'string' ? e : '加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function onScroll(e) {
  const el = e.target
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
    if (!loading.value && !noMore.value) {
      loadData(page.value + 1)
    }
  }
}

onMounted(() => {
  const { roleId, roleName, avatar, dialogCount } = route.query
  roleInfo.value = {
    roleId: String(roleId || ''),
    name: roleName ? decodeURIComponent(String(roleName)) : '',
    avatar: avatar ? decodeURIComponent(String(avatar)) : '',
    dialogCount: dialogCount ? Number(dialogCount) || 0 : 0
  }
  if (!roleInfo.value.roleId) {
    showToast('缺少角色ID')
    return
  }
  loadData(1)
  window.addEventListener('scroll', onScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style lang="scss" scoped>
.role-detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #111827 0%, #050010 40%, #050010 100%);
  color: #fff;
  padding-bottom: env(safe-area-inset-bottom);
}

.role-header {
  display: flex;
  align-items: center;
  padding: 88rpx 32rpx 32rpx;
  gap: 24rpx;
}

.role-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  object-fit: cover;
}

.role-info {
  flex: 1;
  min-width: 0;
}

.role-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-dialog-count {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.consume-list {
  padding: 0 32rpx;
}

.consume-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.consume-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}

.consume-count {
  font-size: 22rpx;
  color: #a855f7;
  margin-left: 12rpx;
}

.consume-date {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.consume-points {
  font-size: 32rpx;
  font-weight: bold;
  color: #fbbf24;
}

.consume-points__origin {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: line-through;
  text-align: right;
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
