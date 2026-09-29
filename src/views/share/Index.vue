<template>
  <div class="share-page-container">
    <CustomNav :show-back="navConfig.showBack" :show-left-logo="navConfig.showLeftLogo" :show-home="false" />

    <div class="header-bg"></div>
    <div class="white-board"></div>

    <div class="content-container">
      <div class="share-status-container">
        <div class="invite-title">
          {{ inviteTitle }}
          <span v-if="inviteStatus === INVITE_STATUS.INVITE" class="invite-title-ai">AI</span>
          <van-icon
            v-if="inviteStatus === INVITE_STATUS.INVITED"
            name="close"
            color="#F94B30"
            size="14"
            style="margin-left: 12px; font-weight: bold;"
          />
        </div>
        <div class="ray-bg"
          :class="{
            'invite-ray': inviteStatus === INVITE_STATUS.INVITE,
            'success-ray': inviteStatus === INVITE_STATUS.SUCCESS
          }"
        ></div>

        <!-- 占位卡：渐变背景模拟 -->
        <div v-if="inviteStatus === INVITE_STATUS.INVITE" class="invite-card">
          <div class="card-text">INVITE</div>
        </div>
        <div v-if="inviteStatus === INVITE_STATUS.SUCCESS" class="success-card">
          <div class="card-text">SUCCESS</div>
        </div>
        <div v-if="inviteStatus === INVITE_STATUS.INVITED" class="invited-card">
          <div class="card-text">INVITED</div>
        </div>

        <div class="items-container" :class="{ 'invite-items': inviteStatus === INVITE_STATUS.INVITE }">
          <div class="item-container">
            {{
              inviteStatus === INVITE_STATUS.SUPPORT
                ? '邀请'
                : inviteStatus === INVITE_STATUS.SUPPORT_SUCCESS
                ? '您邀请'
                : '每邀请'
            }}
            <span class="item-number">1</span>个新用户
          </div>
        <img class="item-step" src="/static/share/invite_step.png" alt="" />
        <div class="item-container">
          {{
            inviteStatus === INVITE_STATUS.SUCCESS
              ? '每人免费'
              : inviteStatus === INVITE_STATUS.SUPPORT_SUCCESS
              ? '可再'
              : '双方均可'
          }}获得<span class="item-number">10</span>次试用
        </div>
        </div>
      </div>

      <!-- SLOGAN -->
      <div v-if="inviteStatus !== INVITE_STATUS.SUCCESS" class="slogan-container">
        外卖返现，不费力！
        <div class="slogan-bg"></div>
        <img class="slogan-icon" src="/static/share/slogan_finger.png" alt="" />
        爆款攻略，任你写！
      </div>

      <!-- 邀请步骤 -->
      <div v-if="inviteStatus === INVITE_STATUS.INVITE" class="invite-steps-container">
        <div class="invite-step-num">1</div>
        邀请好友
        <div class="invite-step-line"></div>
        <div class="invite-step-num">2</div>
        好友注册
        <div class="invite-step-line"></div>
        <div class="invite-step-num">3</div>
        次数到账
      </div>

      <!-- 邀请内容 / 入口列表 -->
      <div v-if="!isShare || inviteStatus === INVITE_STATUS.SUPPORT" class="invite-content">
        <div class="invite-content-bg"></div>
        <div v-if="inviteStatus === INVITE_STATUS.SUPPORT" class="invite-tip-container">
          注册成功后，您将获得10次使用AI的机会哦
        </div>
        <div v-if="inviteStatus === INVITE_STATUS.INVITE" class="invite-tip-container">
          点击【邀请好友】，即可分享
        </div>
        <div v-if="inviteStatus === INVITE_STATUS.SUCCESS" class="invite-tip-container">
          免费次数已到账，可在「我的」查收
        </div>

        <button class="invite-avatar__add" @click="onShareClick">
          <img class="invite-avatar" src="/static/share/avatar_add.png" alt="" />
        </button>

        <div v-if="inviteStatus === INVITE_STATUS.SUCCESS" class="barrage-container">
          <div
            v-for="item in barrageList"
            :key="item.id"
            class="barrage-item"
            :style="{ top: item.top + '%', animation: item.animation }"
          >
            <img class="barrage-avatar" src="/static/avatar.jpg" alt="" />
            {{ item.text }}
            <van-icon class="barrage-logo" name="checked" color="#52C41A" size="14" />
          </div>
        </div>

        <div class="invite-record" @click="onInviteRecordClick">
          <img class="invite-record-icon" src="/static/share/record_icon.png" alt="" />
          邀请记录
        </div>
      </div>

      <div v-else class="entrance-container">
        <div class="entrance-container-title">进入柚子的世界，您可以体验以下功能</div>
        <div class="entrance-items">
          <div
            v-for="(item, idx) in entranceList"
            :key="item.id"
            class="entrance-item"
            @click="onEntranceItemClick(idx)"
          >
            <img class="entrance-item-icon" :src="item.icon" alt="" />
            <div class="entrance-item-content">
              <div class="entrance-item-title">{{ item.name }}</div>
              <div class="entrance-item-desc">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div v-if="inviteStatus === INVITE_STATUS.SUPPORT_SUCCESS" class="bottom-button" @click="onBottomButtonClick">
      返回主页
    </div>
    <button
      v-else-if="inviteStatus === INVITE_STATUS.SUPPORT"
      class="bottom-button"
      @click="onBottomButtonClick"
    >立即注册</button>
    <button
      v-else
      class="bottom-button"
      @click="onShareClick"
    >{{ !isShare ? '邀请好友' : '邀请好友，获得次数' }}</button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { generateInvitationCode, getShareRecord } from '@/api/usercenter'
import { getShareMenus } from '@/api/home/home'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const INVITE_STATUS = {
  INVITE: 'invite',
  SUCCESS: 'success',
  SUPPORT: 'support',
  SUPPORT_SUCCESS: 'support_success',
  INVITED: 'invited'
}

const navConfig = reactive({
  showBack: true,
  showLeftLogo: false
})

const inviteStatus = ref(INVITE_STATUS.INVITE)
const inviteTitle = ref('邀好友，免费用')
const isShare = ref(true)
const invitationCode = ref('')
const barrageList = ref([])
const successList = ref([])
const entranceList = ref([])
const tracks = ref([])

let barrageTimers = []

function addBarrage(text) {
  if (!text) return
  const containerWidth = 620
  const textWidth = text.length * 20 + 48

  let bestTrackIndex = -1
  let minRightEdge = Infinity
  tracks.value.forEach((track, index) => {
    if (track.rightEdge < minRightEdge) {
      minRightEdge = track.rightEdge
      bestTrackIndex = index
    }
  })

  const safeDelay =
    minRightEdge > 0
      ? Math.max(0, (minRightEdge / containerWidth) * 8)
      : Math.random() * 3

  tracks.value[bestTrackIndex].rightEdge = containerWidth + textWidth

  const timer = setTimeout(() => {
    tracks.value[bestTrackIndex].rightEdge = 0
  }, 6000)
  barrageTimers.push(timer)

  const newItem = {
    id: Date.now() + Math.random(),
    text,
    top: 15 + bestTrackIndex * 30,
    animation: `barrageMove 6s linear ${safeDelay}s infinite`
  }

  const newList = [...barrageList.value, newItem]
  if (newList.length > 15) newList.shift()
  barrageList.value = newList
}

function getInviteTitle() {
  let title = ''
  switch (inviteStatus.value) {
    case INVITE_STATUS.INVITE:
      title = '邀好友，免费用'
      break
    case INVITE_STATUS.SUPPORT:
      title = '邀好友，免费用'
      break
    case INVITE_STATUS.SUPPORT_SUCCESS:
      title = '注册成功！'
      break
    case INVITE_STATUS.SUCCESS:
      title = '邀请成功！'
      break
    case INVITE_STATUS.INVITED:
      title = '您已注册，不满足条件'
      break
  }
  inviteTitle.value = title
}

async function getRecord() {
  try {
    const res = await getShareRecord()
    let status = INVITE_STATUS.INVITE
    let list = []
    if (res && res.list && res.list.length > 0) {
      status = INVITE_STATUS.SUCCESS
      list = [...res.list]
    }
    isShare.value = false
    navConfig.showBack = true
    navConfig.showLeftLogo = false
    inviteStatus.value = status
    successList.value = list
    list.forEach((item) => {
      addBarrage(item.nickname)
    })
    getInviteTitle()
  } catch (e) {
    console.error('获取邀请记录失败', e)
  }
}

async function getMenus() {
  try {
    const res = await getShareMenus()
    entranceList.value = res || []
  } catch (e) {
    entranceList.value = []
  }
}

function onInviteRecordClick() {
  router.push('/pages/share/record/index')
}

function onBottomButtonClick() {
  if (
    inviteStatus.value === INVITE_STATUS.INVITE ||
    inviteStatus.value === INVITE_STATUS.SUCCESS ||
    inviteStatus.value === INVITE_STATUS.INVITED
  ) {
    // do nothing
  } else if (inviteStatus.value === INVITE_STATUS.SUPPORT) {
    showAuthDialog()
  } else if (inviteStatus.value === INVITE_STATUS.SUPPORT_SUCCESS) {
    router.push('/pages/home/home')
  }
}

function showAuthDialog() {
  // 跳转到 web 登录页（由 main.js 中 setupAuthBridge 全局监听 h5:show-login-modal 处理）
  window.dispatchEvent(new CustomEvent('h5:show-login-modal', {
    detail: { redirect: route.fullPath }
  }))
}

async function onShareClick() {
  try {
    const res = await generateInvitationCode()
    const code = res && (res.invitationCode || res)
    if (navigator.clipboard && navigator.clipboard.writeText && code) {
      await navigator.clipboard.writeText(String(code))
      showToast('邀请码已复制')
    } else if (code) {
      showToast(`邀请码：${code}`)
    } else {
      showToast('请复制链接分享给好友')
    }
  } catch (e) {
    console.error('生成邀请码失败', e)
    showToast('分享失败，请稍后重试')
  }
}

function onEntranceItemClick(idx) {
  const item = entranceList.value[idx]
  if (!item) return
  if (item.code === 'XiaoHongShu') {
    router.push({
      path: '/pages/contentadd/blog/index',
      query: { id: item.id, title: item.name }
    })
  } else {
    router.push({
      path: '/pages/contentadd/index',
      query: { id: item.id, code: item.code, title: item.name }
    })
  }
}

onMounted(async () => {
  // 初始化 5 条轨道
  tracks.value = new Array(5).fill(0).map(() => ({ rightEdge: 0 }))

  const { invitationCode: code, isShare: shareFlag } = route.query
  if (shareFlag) {
    isShare.value = true
    navConfig.showBack = false
    navConfig.showLeftLogo = true
    inviteStatus.value = INVITE_STATUS.SUPPORT
    invitationCode.value = code
    getInviteTitle()
    if (!userStore.isLogin) {
      window.dispatchEvent(new CustomEvent('h5:show-login-modal', {
        detail: { redirect: route.fullPath }
      }))
    } else {
      getMenus()
    }
  } else {
    if (userStore.isLogin) {
      await getRecord()
    } else {
      inviteStatus.value = INVITE_STATUS.INVITE
      getInviteTitle()
    }
  }
})

onUnmounted(() => {
  barrageTimers.forEach(clearTimeout)
})
</script>

<style lang="scss" scoped>
.share-page-container {
  position: relative;
  min-height: 100vh;
  background: #1a1030;
  color: #fff;
  padding-top: 88px;
  padding-bottom: 160px;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 320px;
  background: linear-gradient(180deg, #6d5cff 0%, #a98cff 100%);
  z-index: 0;
}

.white-board {
  position: absolute;
  top: 280px;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1a1030;
  border-radius: 32px 32px 0 0;
  z-index: 1;
}

.content-container {
  position: relative;
  z-index: 2;
  padding: 24px 32px;
}

.share-status-container {
  position: relative;
  text-align: center;
  padding-bottom: 24px;
}

.invite-title {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.invite-title-ai {
  display: inline-block;
  padding: 2px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 24px;
  font-weight: 600;
}

.ray-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.25), transparent 70%);
  pointer-events: none;
  z-index: -1;
}

.invite-card,
.success-card,
.invited-card {
  width: 320px;
  height: 320px;
  object-fit: contain;
  margin: 16px auto;
}

.items-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 26px;
  color: #fff;
  padding: 16px 0;
}

.item-container {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.item-number {
  font-size: 36px;
  font-weight: 700;
  color: #FFD700;
  padding: 0 4px;
}

.item-step {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.slogan-container {
  position: relative;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  padding: 32px 0;
  color: #fff;
  background: linear-gradient(90deg, #FFD700, #FF9500);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.slogan-bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 16px;
  z-index: -1;
}

.slogan-icon {
  width: 60px;
  height: 60px;
  vertical-align: middle;
}

.invite-steps-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 28px;
  color: #fff;
  padding: 24px 0;
}

.invite-step-num {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.invite-step-line {
  width: 40px;
  height: 2px;
  background: rgba(255, 255, 255, 0.4);
}

.invite-content {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 32px 24px;
  margin-top: 24px;
  text-align: center;
}

.invite-content-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
  border-radius: 24px;
  pointer-events: none;
}

.invite-tip-container {
  position: relative;
  font-size: 28px;
  color: #fff;
  margin-bottom: 24px;
}

.invite-avatar__add {
  position: relative;
  background: transparent;
  border: none;
  padding: 0;
  margin: 16px auto;
  display: block;
  cursor: pointer;
}

.invite-avatar {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.barrage-container {
  position: relative;
  height: 200px;
  overflow: hidden;
  margin: 24px 0;
}

.barrage-item {
  position: absolute;
  left: 100%;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 24px;
  color: #fff;
}

.barrage-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

@keyframes barrageMove {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-150vw);
  }
}

.invite-card,
.success-card,
.invited-card {
  width: 320px;
  height: 320px;
  margin: 16px auto;
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.invite-card {
  background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);
}

.success-card {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.invited-card {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-text {
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.invite-record {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 26px;
  color: #FFD700;
  cursor: pointer;
  padding: 16px;
}

.invite-record-icon {
  width: 32px;
  height: 32px;
}

.entrance-container {
  margin-top: 24px;
}

.entrance-container-title {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
  text-align: center;
}

.entrance-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entrance-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 20px 24px;
  cursor: pointer;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.entrance-item-icon {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  object-fit: cover;
  flex-shrink: 0;
}

.entrance-item-content {
  flex: 1;
  overflow: hidden;
}

.entrance-item-title {
  font-size: 30px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
}

.entrance-item-desc {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-button {
  position: fixed;
  bottom: 32px;
  left: 32px;
  right: 32px;
  height: 92px;
  line-height: 92px;
  text-align: center;
  background: linear-gradient(102deg, #63B4FF 16%, #174DFF 89%);
  border-radius: 24px;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  border: none;
  z-index: 100;
  cursor: pointer;
  padding-bottom: var(--safearea-bottom);
}
</style>
