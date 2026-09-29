<template>
  <div class="chat-style-page" :class="{ 'hide-bg': !showBG }">
    <div class="page-bg" v-if="showBG" :style="{ backgroundImage: `url(${currentBg})` }"></div>
    <div class="page-bg-mask" v-if="showBG"></div>

    <CustomNav title="聊天风格" :show-back="true" />

    <div class="page-content">
      <!-- 标签页 -->
      <div class="tabs-bar">
        <div 
          class="tab-item"
          :class="{ active: activeTab === 0 }"
          @click="onTabChange(0)"
        >
          <span class="tab-text">模版</span>
        </div>
        <div 
          class="tab-item"
          :class="{ active: activeTab === 1 }"
          @click="onTabChange(1)"
        >
          <span class="tab-text">我创建的</span>
        </div>
      </div>

      <!-- 风格列表 -->
      <div class="style-list">
        <div 
          v-for="style in currentList" 
          :key="style.id"
          class="style-item"
          @click="onImportStyle(style)"
        >
          <div class="style-info">
            <div class="style-title">{{ style.title }}</div>
            <div class="style-desc">{{ style.description }}</div>
          </div>
          <van-icon name="arrow-right" class="style-arrow" />
        </div>

        <div v-if="!currentList.length" class="empty-state">
          <img class="empty-image" :src="emptyImage" alt="">
          <p class="empty-text">暂无风格</p>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <van-button type="default" block round class="reset-btn" @click="onResetSettings">
        还原设置
      </van-button>
      <van-button type="primary" block round class="create-btn" @click="onCreateTemplate">
        创建风格
      </van-button>
    </div>

    <van-toast id="van-toast" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'vant/lib/toast'
import CustomNav from '@/components/CustomNav.vue'
import { getChatStyleList, restorePlotChatStyle } from '@/api/role'

const route = useRoute()
const router = useRouter()

const showBG = ref(true)
const currentBg = ref('')
const plotId = ref(null)
const activeTab = ref(0)
const templateList = ref([])
const myStyleList = ref([])

const currentList = computed(() => {
  return activeTab.value === 0 ? templateList.value : myStyleList.value
})

const emptyImage = '/static/images/empty.png'

onMounted(() => {
  // 背景设置检查
  const ev = localStorage.getItem('aE')
  if (ev === '0') {
    showBG.value = false
  }

  plotId.value = route.query.plotId
  currentBg.value = route.query.currentBg || ''
  
  loadStyleList()
})

function onTabChange(index) {
  activeTab.value = index
  loadStyleList()
}

function loadStyleList() {
  getChatStyleList({
    ifSystem: activeTab.value === 0
  }).then(res => {
    if (activeTab.value === 0) {
      templateList.value = [...res]
    } else {
      myStyleList.value = [...res]
    }
  })
}

function onImportStyle(style) {
  // 调用上一页的方法
  const prevPage = window.__prevPage
  if (prevPage && typeof prevPage.confirmChatStyle === 'function') {
    prevPage.confirmChatStyle({
      ...style
    })
  }
  router.back()
}

function onResetSettings() {
  wx.showModal({
    title: '提示',
    content: '确定要还原设置吗？',
    success: (res) => {
      if (res.confirm) {
        restorePlotChatStyle({
          plotId: plotId.value
        }).then(() => {
          Toast({
            message: '已还原',
            icon: 'success'
          })
        })
      }
    }
  })
}

function onCreateTemplate() {
  router.push({
    path: '/role/chat-style/add',
    query: {
      currentBg: currentBg.value
    }
  })
}
</script>

<style lang="scss" scoped>
.chat-style-page {
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

.tabs-bar {
  display: flex;
  justify-content: center;
  gap: 80rpx;
  padding: 24rpx 0;
}

.tab-item {
  position: relative;
  padding: 16rpx 0;
  
  .tab-text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s;
  }
  
  &.active {
    .tab-text {
      color: #fff;
      font-weight: 600;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background: linear-gradient(135deg, #FF5F15, #FF9500);
      border-radius: 2rpx;
    }
  }
}

.style-list {
  padding-bottom: 120rpx;
}

.style-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
}

.style-info {
  flex: 1;
}

.style-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;
}

.style-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.style-arrow {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.4);
  margin-left: 16rpx;
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
    color: rgba(255, 255, 255, 0.6);
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  padding-bottom: calc(24rpx + var(--safearea-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 50;
}

.reset-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
}

.create-btn {
  flex: 2;
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border: none;
}
</style>
