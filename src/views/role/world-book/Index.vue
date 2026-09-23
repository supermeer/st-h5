<template>
  <div class="world-book-page" :class="{ 'hide-bg': !currentBg }">
    <div class="page-bg" v-if="currentBg" :style="{ backgroundImage: `url(${currentBg})` }"></div>
    <div class="page-bg-mask" v-if="currentBg"></div>

    <CustomNav title="词库" :show-back="true" />

    <div class="page-content">
      <!-- 词库列表 -->
      <div class="world-book-list">
        <div 
          v-for="(item, index) in worldBookList" 
          :key="index"
          class="world-book-item"
        >
          <div class="item-header">
            <div class="item-type" :style="{ background: getTypeConfig(item.msgType).color }">
              {{ getTypeConfig(item.msgType).label }}
            </div>
            <div class="item-actions">
              <div class="action-btn" @click="onMoveUp(index)" v-if="index > 0">
                <van-icon name="arrow-up" />
              </div>
              <div class="action-btn" @click="onMoveDown(index)" v-if="index < worldBookList.length - 1">
                <van-icon name="arrow-down" />
              </div>
              <div class="action-btn" @click="onEditItem(index)">
                <van-icon name="edit-o" />
              </div>
              <div class="action-btn delete" @click="onDeleteItem(index)">
                <van-icon name="delete-o" />
              </div>
            </div>
          </div>
          <div class="item-content">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-desc">{{ item.content }}</div>
          </div>
        </div>

        <div v-if="!worldBookList.length" class="empty-state">
          <img class="empty-image" :src="emptyImage" alt="">
          <p class="empty-text">暂无词条</p>
          <p class="empty-sub">点击下方按钮添加词条</p>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <van-button type="default" block round class="add-btn" @click="onAddItem">
        <van-icon name="plus" class="add-icon" />
        新增词条
      </van-button>
      <van-button type="primary" block round class="save-btn" @click="onSave">
        保存
      </van-button>
    </div>

    <TipDialog ref="tipDialogRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CustomNav from '@/components/CustomNav.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'

const router = useRouter()

const tipDialogRef = ref(null)

const currentBg = ref('')
const worldBookList = ref([])

const typeOptions = [
  { label: '系统', value: 'system', color: '#667eea' },
  { label: 'AI', value: 'ai', color: '#6c5ce7' },
  { label: '用户', value: 'user', color: 'rgb(253, 171, 11)' }
]

const emptyImage = '/static/images/empty.png'

onMounted(() => {
  // 存储上一页引用
  window.__prevPage = router.currentRoute.value.meta?.prevPage
  
  // 从路由状态或缓存中获取数据
  const savedData = sessionStorage.getItem('worldBookData')
  if (savedData) {
    const data = JSON.parse(savedData)
    currentBg.value = data.background || ''
    worldBookList.value = data.worldBookList || []
  }
})

function getTypeConfig(type) {
  return typeOptions.find(item => item.value === type) || typeOptions[2]
}

function onMoveUp(index) {
  if (index <= 0) return
  const list = [...worldBookList.value]
  const temp = list[index]
  list[index] = list[index - 1]
  list[index - 1] = temp
  worldBookList.value = list
}

function onMoveDown(index) {
  if (index >= worldBookList.value.length - 1) return
  const list = [...worldBookList.value]
  const temp = list[index]
  list[index] = list[index + 1]
  list[index + 1] = temp
  worldBookList.value = list
}

function onAddItem() {
  // 存储当前数据到 sessionStorage
  sessionStorage.setItem('worldBookData', JSON.stringify({
    background: currentBg.value,
    worldBookList: worldBookList.value
  }))
  
  router.push({
    path: '/role/world-book-edit',
    query: { mode: 'add' }
  })
}

function onEditItem(index) {
  // 存储当前数据到 sessionStorage
  sessionStorage.setItem('worldBookData', JSON.stringify({
    background: currentBg.value,
    worldBookList: worldBookList.value,
    editIndex: index
  }))
  
  router.push({
    path: '/role/world-book-edit',
    query: { mode: 'edit', index }
  })
}

function onDeleteItem(index) {
  tipDialogRef.value?.show({
    content: '确定要删除这个条目吗？',
    cancelText: '取消',
    confirmText: '删除',
    onConfirm: () => {
      const list = [...worldBookList.value]
      list.splice(index, 1)
      worldBookList.value = list
    }
  })
}

function onSave() {
  // 调用上一页的方法
  const prevPage = window.__prevPage
  if (prevPage && typeof prevPage.confirmWorldBook === 'function') {
    prevPage.confirmWorldBook(worldBookList.value)
  }
  router.back()
}
</script>

<style lang="scss" scoped>
.world-book-page {
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

.world-book-list {
  padding-bottom: 120rpx;
}

.world-book-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: rgba(255, 255, 255, 0.05);
}

.item-type {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #fff;
}

.item-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  
  &.delete {
    background: rgba(255, 59, 48, 0.2);
    color: #FF3B30;
  }
}

.item-content {
  padding: 24rpx;
}

.item-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12rpx;
}

.item-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
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
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  z-index: 50;
}

.add-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  
  .add-icon {
    margin-right: 8rpx;
  }
}

.save-btn {
  flex: 2;
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border: none;
}
</style>
