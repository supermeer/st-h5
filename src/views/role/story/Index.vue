<template>
  <div class="story-page" :class="{ 'hide-bg': !showBG }">
    <div class="page-bg" v-if="showBG" :style="{ backgroundImage: `url(${currentBg})` }"></div>
    <div class="page-bg-mask" v-if="showBG"></div>

    <CustomNav title="故事" :show-back="true" />

    <div class="page-content">
      <!-- 故事列表 -->
      <div class="story-list">
        <div 
          v-for="story in storyList" 
          :key="story.id"
          class="story-item"
          :class="{ current: story.id === currentStoryId }"
          @click="onStoryTap(story.id)"
        >
          <div class="story-info">
            <div class="story-title">{{ story.title }}</div>
            <div class="story-time">{{ story.time }}</div>
          </div>
          <div class="story-actions" v-if="story.id !== currentStoryId">
            <div class="delete-btn" @click.stop="onDeletePlot(story.id)">
              <van-icon name="delete-o" />
            </div>
          </div>
          <van-icon v-else name="check" class="current-check" />
        </div>

        <div v-if="!storyList.length" class="empty-state">
          <img class="empty-image" :src="emptyImage" alt="">
          <p class="empty-text">暂无故事</p>
          <p class="empty-sub">点击下方按钮创建新故事</p>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <van-button 
        type="primary" 
        block 
        round
        @click="onCreateStory"
      >
        <van-icon name="plus" class="create-icon" />
        创建新故事
      </van-button>
    </div>

    <StoryDialog ref="storyDialogRef" :roles="roles" @confirm="onStoryConfirm" />
    <TipDialog ref="tipDialogRef" />
    <van-toast id="van-toast" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'vant/lib/toast'
import CustomNav from '@/components/CustomNav.vue'
import StoryDialog from '@/components/dialogs/StoryDialog.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'
import { getCharacterDetail } from '@/api/role'
import { deletePlot, createPlot, createStory } from '@/api/ai/chat'
import { getStoryList } from '@/services/ai/group-chat'

const route = useRoute()
const router = useRouter()

const storyDialogRef = ref(null)
const tipDialogRef = ref(null)

const showBG = ref(true)
const currentBg = ref('')
const currentStoryId = ref(null)
const storyList = ref([])
const roleInfo = ref({
  id: null,
  name: '',
  description: ''
})
const roles = ref([])

const emptyImage = '/static/images/empty.png'

onMounted(() => {
  // 背景设置检查
  const ev = localStorage.getItem('aE')
  if (ev === '0') {
    showBG.value = false
  }

  const { roleId } = route.query
  if (roleId) {
    roleInfo.value.id = roleId
    loadCharacterInfo(roleId)
    loadStoryList({ characterId: roleId })
  }
})

function loadCharacterInfo(roleId) {
  getCharacterDetail(roleId).then(res => {
    let bg = res.backgroundImage
    if (res.currentPlotId) {
      bg = res.plotDetailVO?.backgroundImage
    }
    
    roleInfo.value = {
      ...roleInfo.value,
      ...res
    }
    currentBg.value = bg || ''
    currentStoryId.value = res.plotDetailVO?.storyId || null
    
    // 单角色场景：把当前角色作为可选的开场白角色传入
    roles.value = [{ id: res.id, avatar: res.backgroundImage || res.avatarUrl }]
  })
}

function loadStoryList(params) {
  getStoryList(params).then(res => {
    const list = Array.isArray(res) ? res : (res.list || [])
    storyList.value = list.map(item => ({
      ...item,
      time: formatTime(item.updateTime)
    }))
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

async function onStoryTap(id) {
  if (id === currentStoryId.value) {
    return
  }
  
  const plotId = await createPlot({
    characterId: roleInfo.value.id || undefined,
    storyId: id || undefined,
  })
  
  router.replace({
    path: '/chat',
    query: { 
      plotId: plotId,
      characterId: roleInfo.value.id
    }
  })
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
    if (roleInfo.value.id) {
      loadStoryList({ characterId: roleInfo.value.id })
    }
  } catch (error) {
    console.error('删除剧情失败:', error)
    Toast({
      message: error?.message || '删除失败，请重试',
      icon: 'none'
    })
  }
}

function onCreateStory() {
  storyDialogRef.value?.show({
    roles: roles.value
  })
}

async function onStoryConfirm(data) {
  try {
    const res = await createStory({
      ...data,
      characterId: roleInfo.value.id
    })
    
    if (res && (res.code === 200 || res.code === undefined)) {
      Toast({
        message: '创建成功',
        icon: 'success'
      })
      if (roleInfo.value.id) {
        loadStoryList({ characterId: roleInfo.value.id })
      }
    } else {
      Toast({
        message: (res && res.message) || '创建失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('创建故事失败:', error)
    Toast({
      message: (error && error.message) || '创建失败，请重试',
      icon: 'none'
    })
  }
}
</script>

<script>
// dayjs 需要在这里引入
import dayjs from 'dayjs'
export default {
  created() {
    this.dayjs = dayjs
  }
}
</script>

<style lang="scss" scoped>
.story-page {
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

.story-list {
  padding-bottom: 120rpx;
}

.story-item {
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

.story-info {
  flex: 1;
}

.story-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;
}

.story-time {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.story-actions {
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
    margin-bottom: 16rpx;
  }
  
  .empty-sub {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.5);
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + var(--safearea-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 50;
  
  .van-button {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    border: none;
  }
  
  .create-icon {
    margin-right: 8rpx;
  }
}
</style>
