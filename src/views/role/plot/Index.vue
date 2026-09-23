<template>
  <div class="plot-list-page">
    <CustomNav title="剧情列表" :show-back="true" />
    
    <div class="page-content">
      <div v-if="plotList.length === 0" class="empty-state">
        <div class="empty-icon">📜</div>
        <div class="empty-text">暂无剧情</div>
        <div class="empty-hint">开始对话后将自动创建剧情</div>
      </div>

      <div v-else class="plot-list">
        <div 
          v-for="plot in plotList" 
          :key="plot.id"
          class="plot-item"
          :class="{ active: plot.ifCurrent }"
          @click="onPlotTap(plot)"
        >
          <div class="plot-main">
            <div class="plot-title">
              <span v-if="plot.ifCurrent" class="current-tag">当前</span>
              {{ plot.title }}
            </div>
            <div class="plot-time">{{ plot.time }}</div>
          </div>
          <div class="plot-actions">
            <van-icon name="delete-o" class="delete-btn" @click.stop="onDeletePlot(plot)" />
          </div>
        </div>
      </div>
    </div>

    <TipDialog ref="tipDialogRef" />
    <van-toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'
import { getPlotListByCharacterId, getCharacterDetail } from '@/api/role'
import { deletePlot, setCurrentPlot } from '@/api/ai/chat'

const route = useRoute()
const router = useRouter()

const tipDialogRef = ref(null)

const roleInfo = ref({
  id: null,
  name: '',
  avatar: ''
})

const plotList = ref([])
const currentPlotId = ref(null)

onMounted(() => {
  const { roleId, groupId } = route.query
  if (roleId) {
    roleInfo.value.id = roleId
    loadPlotList()
    loadCharacterInfo(roleId)
  }
})

async function loadCharacterInfo(roleId) {
  try {
    const res = await getCharacterDetail(roleId)
    roleInfo.value = { ...roleInfo.value, ...res }
    currentPlotId.value = res.currentPlotId || null
  } catch (e) {
    console.error('加载角色信息失败', e)
  }
}

async function loadPlotList() {
  try {
    const params = {
      characterId: roleInfo.value.id,
      groupId: route.query.groupId
    }
    const res = await getPlotListByCharacterId(params)
    plotList.value = (res.list || []).map(item => ({
      ...item,
      time: formatTime(item.updateTime)
    }))
    currentPlotId.value = res.currentPlotId || null
  } catch (e) {
    console.error('加载剧情列表失败', e)
  }
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  
  const now = new Date()
  const time = new Date(timestamp)
  const diffDays = Math.floor((now - time) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return weekdays[time.getDay()]
  } else if (now.getFullYear() === time.getFullYear()) {
    return `${(time.getMonth() + 1).toString().padStart(2, '0')}-${time.getDate().toString().padStart(2, '0')}`
  } else {
    return `${time.getFullYear()}-${(time.getMonth() + 1).toString().padStart(2, '0')}-${time.getDate().toString().padStart(2, '0')}`
  }
}

async function onPlotTap(plot) {
  if (plot.ifCurrent) return
  
  try {
    await setCurrentPlot({ plotId: plot.id, characterId: roleInfo.value.id })
    showToast({ message: '剧情切换成功', icon: 'success' })
    router.replace({
      path: '/pages/chat/index',
      query: {
        plotId: plot.id,
        characterId: roleInfo.value.id
      }
    })
  } catch (e) {
    showToast({ message: '剧情切换失败', icon: 'none' })
  }
}

function onDeletePlot(plot) {
  tipDialogRef.value?.show({
    content: '删除后，该剧情的所有对话将被清除，且不可撤回。',
    cancelText: '取消',
    confirmText: '删除',
    onConfirm: async () => {
      try {
        await deletePlot({ id: plot.id })
        showToast({ message: '删除成功', icon: 'success' })
        loadPlotList()
      } catch (e) {
        showToast({ message: '删除失败', icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.plot-list-page {
  min-height: 100vh;
  background: #1a1a1a;
}

.page-content {
  padding-top: 88px;
  padding-bottom: 24rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #fff;
  margin-bottom: 16rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
}

.plot-list {
  padding: 0 24rpx;
}

.plot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    border: 1px solid #FF5F15;
  }
}

.plot-main {
  flex: 1;
  min-width: 0;
}

.plot-title {
  font-size: 30rpx;
  color: #fff;
  margin-bottom: 8rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.current-tag {
  font-size: 22rpx;
  color: #FF5F15;
  background: rgba(255, 95, 21, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.plot-time {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.plot-actions {
  padding: 16rpx;
}

.delete-btn {
  font-size: 40rpx;
  color: rgba(255, 255, 255, 0.5);
  
  &:active {
    color: #ff4d4f;
  }
}
</style>
