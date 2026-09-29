<template>
  <div class="voice-list-page" :class="{ 'hide-bg': !showBg }">
    <div class="page-bg" v-if="showBg" :style="{ backgroundImage: `url(${currentBg})` }"></div>
    <div class="page-bg-mask"></div>

    <CustomNav 
      title="" 
      :show-back="true" 
      :show-home="false" 
      transparent
    />

    <div class="tab-bar">
      <div 
        v-for="(tab, index) in tabs" 
        :key="index"
        class="tab-item"
        :class="{ active: activeTab === index }"
        @click="onTabChange(index)"
      >
        <span class="tab-text">{{ tab }}</span>
      </div>
    </div>

    <div class="filter-panel">
      <div class="filter-scroll">
        <div class="filter-row">
          <div
            v-for="type in voiceTypes"
            :key="type.id"
            class="filter-chip"
            :class="{ active: activeType === type.id }"
            @click="onTypeChange(type.id)"
          >
            {{ type.name }}
          </div>
        </div>
      </div>
    </div>

    <div class="scroll-content" ref="scrollRef">
      <div class="voice-list" :style="{ paddingBottom: 'calc(var(--safearea-bottom) + 160rpx)' }">
        <div v-if="!voiceList.length" class="empty-state">
          <img class="empty-image" :src="backgroundPlaceholder" alt="">
          <p class="empty-text">{{ emptyTip }}</p>
          <p class="empty-sub">tips：可收藏自己喜欢的声音哦~</p>
        </div>

        <div
          v-for="item in voiceList"
          :key="item.id"
          class="voice-item"
          :class="{ 'voice-item-selected': item.id == selectedVoiceId }"
          @click="onSelectVoice(item.id)"
        >
          <div class="voice-item-main">
            <div class="voice-header">
              <div class="voice-title-wrap">
                <span class="voice-name">{{ item.voiceName }}</span>
                <span v-if="item.id == currentVoiceId" class="voice-selected-mark">当前声音</span>
              </div>
              <div class="voice-actions">
                <div 
                  class="voice-play" 
                  :class="{ active: playingVoiceId == item.id }"
                  @click.stop="onPlayVoice(item)"
                >
                  <span class="voice-play-text">{{ playingVoiceId == item.id ? '暂停' : '试听' }}</span>
                </div>
                <div 
                  class="voice-favorite" 
                  :class="{ active: item.isFavorite }"
                  @click.stop="onToggleFavorite(item)"
                >
                  <van-icon name="star" size="34rpx" :color="item.isFavorite ? '#8b5cf6' : 'rgba(255,255,255,0.72)'" />
                </div>
              </div>
            </div>
            <div class="voice-tags">
              <span v-for="tag in item.tags" :key="tag" class="voice-tag">#{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-actions">
      <div class="action-btn outline-btn" @click="onResetSettings">
        <span class="btn-text">恢复默认设置</span>
      </div>
      <div class="action-btn primary-btn" @click="onSaveSettings">
        <span class="btn-text">保存设置</span>
      </div>
    </div>

    <TipDialog ref="tipDialogRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'
import { getCharacterDetail } from '@/api/role'
import {
  getVoiceList,
  setCharacterVoice,
  updateCharacterVoice,
  getVoiceTypes,
  getVoiceTags,
  addFavoriteVoice,
  removeFavoriteVoice,
  resetCharacterVoice
} from '@/api/tts'

const route = useRoute()
const router = useRouter()

const scrollRef = ref(null)
const tipDialogRef = ref(null)

const showBg = ref(true)
const currentBg = ref('')
const from = ref('')
const activeTab = ref(0)
const tabs = ['全部声音', '我的收藏']

const voiceTypes = ref([])
const activeType = ref('')
const voiceTags = ref([])
const activeTag = ref('')
const voiceList = ref([])

const currentVoiceId = ref(null)
const selectedVoiceId = ref(null)
const defaultVoiceId = ref(null)
const defaultVoiceName = ref(null)
const playingVoiceId = ref(null)
const characterId = ref(null)

const emptyTip = '暂无声音'
const backgroundPlaceholder = '/static/images/placeholder.png'

let audioContext = null

onMounted(() => {
  // 隐藏背景检查
  const ev = localStorage.getItem('aE')
  if (ev === '0') {
    showBg.value = false
  }

  const { characterId: cid, voiceId, from: fromParam } = route.query
  characterId.value = cid || null
  
  if (!cid && voiceId) {
    currentVoiceId.value = voiceId
    selectedVoiceId.value = voiceId
  }
  
  if (cid) {
    from.value = fromParam || ''
    loadRoleInfo(cid)
  }
  
  loadVoiceList()
  loadVoiceTypes()
  
  // 存储上一页引用
  const prevPage = window.__prevPage
  console.log('prevPage:', prevPage)
})

onUnmounted(() => {
  stopVoiceAudio(false)
})

function loadRoleInfo(id) {
  getCharacterDetail(id).then(res => {
    currentBg.value = res.backgroundImage || ''
    defaultVoiceId.value = res.voiceId
    defaultVoiceName.value = res.voiceName
    
    const voiceId = res.userVoiceId || res.voiceId
    if (voiceId) {
      currentVoiceId.value = from.value === 'usercenter' ? res.voiceId : voiceId
      selectedVoiceId.value = from.value === 'usercenter' ? res.voiceId : voiceId || ''
    }
  })
}

function loadVoiceList() {
  getVoiceList({
    onlyFavorite: activeTab.value === 1,
    voiceTypeIds: activeType.value || ''
  }).then(res => {
    voiceList.value = res || []
  })
}

function loadVoiceTypes() {
  getVoiceTypes().then(res => {
    voiceTypes.value = res || []
  })
}

function loadVoiceTags() {
  getVoiceTags().then(res => {
    voiceTags.value = res || []
  })
}

function onTabChange(index) {
  activeTab.value = index
  loadVoiceList()
}

function onTypeChange(type) {
  activeType.value = activeType.value === type ? '' : type
  activeTag.value = ''
  loadVoiceList()
}

function onTagChange(tag) {
  activeTag.value = tag || ''
  loadVoiceList()
}

function onSelectVoice(id) {
  selectedVoiceId.value = id
}

function onToggleFavorite(item) {
  if (!item || item.id === undefined || item.id === null) {
    return
  }
  const req = item.isFavorite ? removeFavoriteVoice : addFavoriteVoice
  req({ voiceId: item.id }).then(() => {
    loadVoiceList()
  })
}

function onPlayVoice(voice) {
  if (!voice || !voice.sampleUrl) {
    showToast({ message: '暂无试听音频', icon: 'none' })
    return
  }

  if (playingVoiceId.value === voice.id) {
    stopVoiceAudio()
    return
  }

  playVoiceAudio(voice)
}

function playVoiceAudio(voice) {
  stopVoiceAudio(false)
  
  audioContext = new window.AudioContext()
  
  fetch(voice.sampleUrl)
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      audioContext.src = url
      audioContext.play()
      
      audioContext.onplay = () => {
        playingVoiceId.value = voice.id
      }
      
      audioContext.onended = () => {
        stopVoiceAudio()
      }
      
      audioContext.onerror = () => {
        stopVoiceAudio()
        showToast({ message: '播放失败，请稍后重试', icon: 'none' })
      }
    })
    .catch(() => {
      stopVoiceAudio()
      showToast({ message: '播放失败，请稍后重试', icon: 'none' })
    })
}

function stopVoiceAudio(needRefresh = true) {
  if (audioContext) {
    audioContext.pause()
    audioContext = null
  }
  if (playingVoiceId.value === null) {
    return
  }
  if (needRefresh) {
    playingVoiceId.value = null
  }
}

function callBack(voiceData) {
  let voice = voiceData
  if (!voice) {
    voice = voiceList.value.find(item => item.id === selectedVoiceId.value)
  }
  if (!voice) {
    return
  }
  
  // 调用上一页的方法
  const prevPage = window.__prevPage
  if (prevPage && typeof prevPage.confirmRoleVoice === 'function') {
    prevPage.confirmRoleVoice({ voiceId: voice.id, voiceName: voice.voiceName })
  }
  
  router.back()
}

function onResetSettings() {
  if (from.value === 'usercenter') {
    showToast({ message: '无法恢复默认设置', icon: 'none' })
    return
  }
  
  tipDialogRef.value?.show({
    content: '确认恢复默认设置？',
    cancelText: '取消',
    confirmText: '立即恢复',
    onConfirm: () => {
      if (!characterId.value) {
        callBack({ voiceId: defaultVoiceId.value, voiceName: defaultVoiceName.value })
        return
      }
      resetCharacterVoice({ characterId: characterId.value })
        .then(() => {
          callBack({ voiceId: defaultVoiceId.value, voiceName: defaultVoiceName.value })
        })
    }
  })
}

function onSaveSettings() {
  if (!selectedVoiceId.value) {
    showToast({ message: '您还未选择语音', icon: 'none' })
    return
  }
  
  if (characterId.value) {
    let req = setCharacterVoice
    if (from.value === 'usercenter') {
      req = updateCharacterVoice
    }
    req({
      voiceId: selectedVoiceId.value,
      id: characterId.value,
      characterId: characterId.value
    }).then(() => {
      callBack()
    })
  } else {
    callBack()
  }
}
</script>

<style lang="scss" scoped>
.voice-list-page {
  min-height: 100vh;
  background: #1a1a1a;
  position: relative;
}

.hide-bg {
  .page-bg {
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

.tab-bar {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  gap: 80rpx;
  padding: 0 0 24rpx;
  margin-top: 160rpx;
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

.filter-panel {
  position: relative;
  z-index: 10;
  padding: 0 24rpx;
  margin-bottom: 16rpx;
}

.filter-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-row {
  display: flex;
  gap: 16rpx;
  padding: 8rpx 0;
}

.filter-chip {
  flex-shrink: 0;
  padding: 12rpx 28rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  
  &.active {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    color: #fff;
  }
}

.scroll-content {
  position: relative;
  z-index: 10;
  height: calc(100vh - 400px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.voice-list {
  padding: 16rpx 24rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  
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

.voice-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
  
  &.voice-item-selected {
    border-color: #FF5F15;
    background: rgba(255, 95, 21, 0.1);
  }
}

.voice-item-main {
  .voice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }
}

.voice-title-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.voice-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}

.voice-selected-mark {
  font-size: 20rpx;
  color: #FF5F15;
  background: rgba(255, 95, 21, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.voice-actions {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.voice-play {
  padding: 10rpx 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30rpx;
  cursor: pointer;
  
  .voice-play-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
  }
  
  &.active {
    background: rgba(255, 95, 21, 0.2);
    
    .voice-play-text {
      color: #FF5F15;
    }
  }
}

.voice-favorite {
  cursor: pointer;
  
  &.active {
    animation: scalePulse 0.3s ease;
  }
}

@keyframes scalePulse {
  50% {
    transform: scale(1.2);
  }
}

.voice-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.voice-tag {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
}

.bottom-actions {
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

.action-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
  cursor: pointer;
  
  .btn-text {
    font-size: 30rpx;
    font-weight: 500;
  }
  
  &.outline-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    
    .btn-text {
      color: rgba(255, 255, 255, 0.9);
    }
  }
  
  &.primary-btn {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    flex: 2;
    
    .btn-text {
      color: #fff;
    }
  }
}
</style>
