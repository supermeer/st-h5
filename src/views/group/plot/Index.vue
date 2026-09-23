<template>
  <div class="plot-page" :class="{ 'hide-bg': !showBG }">
    <div class="page-bg" v-if="showBG" :style="{ backgroundImage: `url(${currentBg})` }"></div>
    <div class="page-bg-mask" v-if="showBG"></div>

    <CustomNav title="剧情" :show-back="true" />

    <div class="page-content">
      <!-- 剧情列表 -->
      <div class="plot-list">
        <div 
          v-for="plot in plotList" 
          :key="plot.id"
          class="plot-item"
          :class="{ current: plot.ifCurrent }"
          @click="onPlotTap(plot)"
        >
          <div class="plot-info">
            <div class="plot-title">{{ plot.title || '剧情 ' + plot.id }}</div>
            <div class="plot-time">{{ plot.time }}</div>
          </div>
          <div class="plot-actions" v-if="!plot.ifCurrent">
            <div class="delete-btn" @click.stop="onDeletePlot(plot.id)">
              <van-icon name="delete-o" />
            </div>
          </div>
          <van-icon v-else name="check" class="current-check" />
        </div>

        <div v-if="!plotList.length" class="empty-state">
          <img class="empty-image" :src="emptyImage" alt="">
          <p class="empty-text">暂无剧情</p>
        </div>
      </div>
    </div>

    <TipDialog ref="tipDialogRef" />
    <van-toast id="van-toast" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'vant/lib/toast'
import CustomNav from '@/components/CustomNav.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'
import { getGroupDetail } from '@/api/group'
import { getPlotListByGroupChatId, setCurrentPlot } from '@/services/ai/group-chat'
import { deletePlot } from '@/api/ai/chat'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const tipDialogRef = ref(null)

const showBG = ref(true)
const currentBg = ref('')
const currentPlotId = ref(null)
const plotList = ref([])
const groupInfo = ref({
  id: null,
  name: '',
  avatarUrls: [],
  description: ''
})

const emptyImage = '/static/images/empty.png'

onMounted(() => {
  // 背景设置检查
  const ev = localStorage.getItem('aE')
  if (ev === '0') {
    showBG.value = false
  }

  const { groupId } = route.query
  if (groupId) {
    groupInfo.value.id = groupId
    loadPlotList(groupId)
    loadGroupInfo(groupId)
  }
})

function loadGroupInfo(groupId) {
  getGroupDetail(groupId, '').then(res => {
    let bg = res.backgroundImage
    if (res.currentPlotId && res.plotDetailVO) {
      bg = res.plotDetailVO.backgroundImage
    }
    
    groupInfo.value = {
      ...groupInfo.value,
      ...res,
      avatarUrls: res.avatarUrls || []
    }
    currentPlotId.value = res.currentPlotId || null
    currentBg.value = bg || ''
  })
}

function loadPlotList(groupChatId) {
  const params = {
    groupChatId: groupChatId || groupInfo.value.id
  }
  getPlotListByGroupChatId(params).then(res => {
    plotList.value = [...res.list || []].map(item => ({
      ...item,
      time: formatTime(item.updateTime)
    }))
    currentPlotId.value = res.currentPlotId || null
  })
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  
  const now = dayjs()
  const time = dayjs(timestamp)
  const diffDays = now.diff(time, 'day')
  
  if (diffDays === 0) {
    return time.format('HH:mm')
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return weekdays[time.day()]
  } else if (now.year() === time.year()) {
    return time.format('MM-DD')
  } else {
    return time.format('YYYY-MM-DD')
  }
}

async function onPlotTap(plot) {
  if (plot.ifCurrent) {
    return
  }
  
  try {
    await setCurrentPlot({ plotId: plot.id, groupChatId: groupInfo.value.id })
    Toast({
      message: '剧情切换成功',
      icon: 'success'
    })
    router.push({
      path: '/chat',
      query: { 
        plotId: plot.id,
        groupId: groupInfo.value.id
      }
    })
  } catch (error) {
    console.error('设置当前剧情失败:', error)
    Toast({
      message: error?.message || '设置当前剧情失败，请重试',
      icon: 'none'
    })
  }
}

function onDeletePlot(id) {
  tipDialogRef.value?.show({
    content: '删除后，该剧情的所有对话将被清除，且不可撤回。',
    cancelText: '取消',
    confirmText: '删除',
    onConfirm: () => {
      deletePlotItem(id)
    }
  })
}

async function deletePlotItem(id) {
  try {
    await deletePlot({ id })
    Toast({
      message: '删除成功',
      icon: 'success'
    })
    if (groupInfo.value.id) {
      loadPlotList(groupInfo.value.id)
    }
  } catch (error) {
    console.error('删除剧情失败:', error)
    Toast({
      message: error?.message || '删除失败，请重试',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.plot-page {
  min-height: 100vh;
  background: #1a1a1a;
  padding-bottom: 200rpx;
}

.hide-bg {
  .page-bg,
  .page-bg-mask {
    display: none;
  }
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.page-bg-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1;
}

.page-content {
  position: relative;
  z-index: 10;
  padding-top: 88px;
  padding: 88px 24rpx 0;
}

.plot-list {
  padding-bottom: 120rpx;
}

.plot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  
  &.current {
    border-color: #FF5F15;
    background: rgba(255, 95, 21, 0.1);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.plot-info {
  flex: 1;
}

.plot-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;
}

.plot-time {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.plot-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.delete-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 59, 48, 0.2);
  border-radius: 50%;
  color: #FF3B30;
  cursor: pointer;
}

.current-check {
  font-size: 40rpx;
  color: #FF5F15;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 32rpx;
    opacity: 0.5;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
