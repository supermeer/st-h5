<template>
  <div class="record-page">
    <CustomNav title="邀请记录" :show-back="true" />

    <div class="content-container">
      <div v-if="loading && recordList.length === 0" class="loading-wrap">
        <van-loading type="spinner" color="#FF5F15" />
      </div>

      <template v-else>
        <div v-if="recordList.length === 0" class="empty-container">
          <img class="empty-image" src="/static/images/empty-data.png" alt="" />
          <div class="empty-text">暂无邀请记录</div>
        </div>

        <div v-else class="record-list">
          <div v-for="item in recordList" :key="item.id || item.userId" class="record-item">
            <div class="user-avatar">
              <img class="avatar-image" :src="item.avatar || '/static/avatar.jpg'" alt="" />
            </div>
            <div class="user-info">
              <div class="user-name">{{ item.nickname }}</div>
            </div>
            <div class="record-time">{{ item.invitedTime }}</div>
          </div>

          <div v-if="loadingMore" class="loading-more">
            <van-loading type="spinner" size="20" color="#5B00FF" />
          </div>
          <div v-else-if="!hasMore && recordList.length > 0" class="no-more">没有更多了</div>
        </div>
      </template>

      <div :style="{ height: '60px' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CustomNav from '@/components/CustomNav.vue'
import { getShareRecord } from '@/api/usercenter'

const recordList = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)

onMounted(() => {
  loadRecordList(true)
})

async function loadRecordList(reset = false) {
  if (reset) {
    page.value = 1
    recordList.value = []
    hasMore.value = true
  }
  if (!hasMore.value && !reset) return

  if (reset) {
    loading.value = true
  } else {
    if (!hasMore.value) return
    loadingMore.value = true
  }

  try {
    const res = await getShareRecord()
    const list = (res.list || []).map((item) => ({
      ...item,
      invitedTime: (item.invitedTime || '').replace('T', ' ')
    }))
    if (reset) {
      recordList.value = list
    } else {
      recordList.value = [...recordList.value, ...list]
    }
    hasMore.value = list.length === pageSize
    page.value++
  } catch (e) {
    console.error('获取邀请记录失败', e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}
</script>

<style lang="scss" scoped>
.record-page {
  min-height: 100vh;
  background: #1a1a1a
    url('https://yoursx-static-1371529546.cos.ap-guangzhou.myqcloud.com/page_bg_1.png') center/cover no-repeat;
  color: #fff;
  padding-top: 88px;
}

.content-container {
  min-height: calc(100vh - 88px);
  padding: 24px 32px;
}

.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
  color: rgba(255, 255, 255, 0.6);
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200px 0;
  color: rgba(255, 255, 255, 0.6);
}

.empty-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 28px;
}

.record-list {
  display: flex;
  flex-direction: column;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 28px;
  color: #fff;
}

.record-time {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.5);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 0;
  color: rgba(255, 255, 255, 0.6);
}

.no-more {
  text-align: center;
  padding: 32px 0;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
