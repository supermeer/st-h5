<template>
  <div class="page usercenter-page">
    <CustomNav transparent :show-back="false" :show-home="false" :show-left-logo="false">
      <template #center>
        <img class="nav-logo" src="/static/usercenter/mine_nav.jpg" alt="" />
      </template>
    </CustomNav>

    <div class="usercenter-content">
      <!-- 用户信息 -->
      <div class="user-info">
        <div class="user-info-avatar-wrapper" @click="goEditProfile">
          <img class="user-info-avatar" :src="userInfo?.avatarUrl || defaultAvatar" alt="" />
          <div class="user-info-avatar-edit">
            <van-icon name="edit" size="18" color="#fff" />
          </div>
        </div>
        <div class="user-info-name" @click="goEditProfile">
          <div class="nickname">{{ userInfo?.nickname || '小柚子' }}</div>
          <div class="user-info-uid">
            <text>ID：{{ userInfo?.uid || '-' }}</text>
            <span class="id-copy-btn" @click.stop="copyId">复制</span>
          </div>
          <div class="user-invite-code">
            <div class="user-invite-code-item" @click="onInviteCodeClick">
              <img class="user-invite-code-icon" src="/static/usercenter/score.png" alt="" />
              填写邀请码
            </div>
            <div class="user-invite-code-item" @click="onInviteClick">
              <van-icon name="share-o" class="user-invite-code-icon" size="16" />
              邀请好友
            </div>
          </div>
        </div>
        <van-icon class="user-info-arr" name="setting-o" size="28" color="#fff" @click="goEditProfile" />
      </div>

      <!-- 积分盒子 -->
      <div class="score-box" @click="onScoreClick">
        <img class="score-box-icon" src="/static/vip/score.png" alt="" />
        <span class="score-box-text">{{ totalPoints }}</span>
        <span class="score-box-desc">
          今日赠送{{ pointInfo?.dailyFreeBalancePreset || 0 }}积分已到账
        </span>
        <van-icon class="score-box-arr" name="arrow" size="18" />
      </div>

      <!-- VIP 续费盒子 -->
      <div class="vip-box" @click="onVipRenewClick">
        <div class="vip-box-left-content">
          <div class="vip-box-header">
            <img v-if="!vipInfo?.ifVip" class="vip-box-header-icon" src="/static/vip/vip.png" alt="" />
            <span class="vip-box-header-text">
              {{ vipInfo?.ifVip ? '星柚会员' : '开通会员' }}
            </span>
            <div v-if="!vipInfo?.ifVip" class="open-vip-btn" @click.stop="onVipRenewClick">立即开通</div>
          </div>
          <div class="open-vip-btm-line">
            <template v-if="vipInfo?.ifVip">
              {{ vipInfo?.formattedMonthlyExpireTime }}
            </template>
            <div v-else>无限畅聊 记忆增强 更多灵感回复</div>
          </div>
        </div>
        <img v-if="vipInfo?.ifVip" class="vip-box-icon" src="/static/vip/vip.png" alt="" />
      </div>

      <!-- 星耀酒馆入口 -->
      <div v-if="false" class="star-yao-ji-entry" @click="onStarYaoJiClick">
        <div class="star-yao-ji-entry-left">
          <div class="star-yao-ji-entry-icon-wrapper">
            <div class="star-yao-ji-entry-icon" />
          </div>
          <div class="star-yao-ji-entry-text">
            <div class="star-yao-ji-entry-title">星耀集</div>
            <div class="star-yao-ji-entry-desc">我的收益 · 我的战绩</div>
          </div>
        </div>
        <div class="star-yao-ji-entry-right">
          <div class="star-yao-ji-entry-tag">参与</div>
          <van-icon name="arrow" size="18" color="#ffd54a" />
        </div>
      </div>

      <!-- 内容主 tabs：智能体 / 群聊 -->
     <div class="type-header">
       <div class="content-tabs">
         <div
           class="content-tab"
           :class="{ active: activeMainTab === 'role' }"
           @click="onMainTabChange('role')"
         >
           智能体
           <div v-if="activeMainTab === 'role'" class="content-tab-underline"></div>
         </div>
         <div
           class="content-tab"
           :class="{ active: activeMainTab === 'group' }"
           @click="onMainTabChange('group')"
         >
           群聊
           <div v-if="showGroupRedDot" class="content-tab-red-dot"></div>
           <div v-if="activeMainTab === 'group'" class="content-tab-underline"></div>
         </div>
       </div>

<!-- 智能体 tab 内容 -->
       <span class="title-desc">(长按卡片可以发布、编辑等)</span>
     </div>

     <!-- 二级 tabs（我的/广场）固定不动，不随卡片滚动 -->
     <div v-if="activeMainTab === 'role'" class="role-type-tabs">
       <div
         v-for="(item, idx) in roleTypeList"
         :key="item.value"
         class="role-type-tab"
         :class="{ active: activeRoleType === item.value }"
         @click="onRoleTypeChange(item.value, idx)"
       >
         {{ item.name }} {{ item.count }}
       </div>
     </div>

     <div v-if="activeMainTab === 'group'" class="group-type-tabs">
       <div
         v-for="(item, idx) in groupTypeList"
         :key="item.value"
         class="group-type-tab"
         :class="{ active: activeGroupType === item.value }"
         @click="onGroupTypeChange(item.value, idx)"
       >
         {{ item.name }} {{ item.count }}
       </div>
     </div>

<!-- 仅卡片列表区域独立滚动；二级 tabs 保持在 list-wrap 外面，固定不动 -->
     <div class="usercenter-list-wrap">
      <template v-if="activeMainTab === 'role'">
        <div class="role-list">
          <div
            v-for="role in roleList"
            :key="role.id"
            class="role-card"
            :style="{ backgroundImage: `url(${role.backgroundImage || role.avatar || ''})` }"
            @click="onRoleClick(role)"
            @contextmenu.prevent="onRoleLongPress(role)"
          >
            <div
              v-if="role.publishStatus === 3"
              class="reject-reason-btn"
              @click.stop="showRejectReason(role)"
            >
              查看原因
            </div>
            <div
              v-if="role._statusBadge && role._statusBadge.text"
              :class="['role-status-ribbon', role._statusBadge.className]"
            >
              {{ role._statusBadge.text }}
            </div>
            <div class="role-info">
              <div class="role-name-row">
                <span class="role-name">{{ role.name }}</span>
              </div>
              <div
                v-if="role.publishStatus && role.publishStatus !== 0"
                class="role-hot"
              >
                <span>💬 {{ role.messageCount || 0 }}</span>
                <span style="margin-left: 12rpx;">🔥 {{ role.browseCount || 0 }}</span>
              </div>
            </div>
          </div>
          <div v-if="roleList.length === 0" class="role-empty-state">
            <div class="empty-text">
              参与创作者激励活动，奖励超香！
              <span class="author-btn" @click="onActivityClick">查看活动</span>
            </div>
            <div class="empty-desc" @click="goCreateRole">
              <van-icon name="plus" class="role-create-btn" size="14" />
              创建智能体
            </div>
          </div>
        </div>
      </template>

      <!-- 群聊 tab 内容 -->
      <template v-if="activeMainTab === 'group'">
        <div class="group-list">
          <div
            v-for="group in groupList"
            :key="group.groupChatId"
            class="group-card"
            @click="onGroupClick(group)"
            @contextmenu.prevent="onGroupLongPress(group)"
          >
            <div class="group-card-avatar">
              <img
                v-if="group.avatarUrls && group.avatarUrls[0]"
                :src="group.avatarUrls[0]"
                alt=""
              />
            </div>
            <div
              v-if="group.publishStatus === 3"
              class="group-reject-reason-btn"
              @click.stop="showGroupRejectReason(group)"
            >
              查看原因
            </div>
            <div
              v-if="group._statusBadge && group._statusBadge.text"
              :class="['group-status-ribbon', group._statusBadge.className]"
            >
              {{ group._statusBadge.text }}
            </div>
            <div class="group-info">
              <div class="group-name-row">
                <span class="group-name">{{ group.name }}</span>
              </div>
            </div>
          </div>
          <div v-if="groupList.length === 0" class="group-empty-state">
            <div class="empty-text">暂无群聊</div>
            <div class="empty-desc" @click="goCreateGroup">
              <van-icon name="plus" class="role-create-btn" size="14" />
              创建群聊
            </div>
          </div>
        </div>
      </template>
     </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import { useUserStore } from '@/store/user'
import { copyToClipboard } from '@/utils/util'
import { getCharacterList, deleteCharacter, applyCharacterPublished, unpublishChar, getAuditRejectReason } from '@/api/role'
import { getUserGroupChatList, applyPublish as applyGroupPublish, unpublishGroup, deleteGroup, getAuditRejectReason as getGroupAuditRejectReason } from '@/api/group'

const router = useRouter()
const userStore = useUserStore()

const defaultAvatar = '/static/usercenter/user_icon.png'
const userInfo = computed(() => userStore.userInfo)
const vipInfo = computed(() => userStore.vipInfo)
const pointInfo = computed(() => userStore.pointInfo)
const totalPoints = computed(() => {
  const pb = Number(pointInfo.value?.pointBalance || 0)
  const df = Number(pointInfo.value?.dailyFreeBalance || 0)
  return pb + df
})

// 主 tab：智能体 / 群聊
const activeMainTab = ref('role')
const showGroupRedDot = ref(false)

// 智能体相关
const roleList = ref([
  {
    id: 1,
    name: '智能体1',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  },
  
  {
    id: 2,
    name: '智能体2',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  },
  {
    id: 3,
    name: '智能体3',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  },
  {
    id: 4,
    name: '智能体4',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  },
  {
    id: 5,
    name: '智能体5',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  },
  {
    id: 6,
    name: '智能体6',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  },
  {
    id: 7,
    name: '智能体7',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  },
  {
    id: 8,
    name: '智能体8',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  },
  {
    id: 9,
    name: '智能体9',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  },
  {
    id: 10,
    name: '智能体10',
    avatar: 'https://img.yzcdn.cn/vant/ipad.png',
    backgroundImage: 'https://img.yzcdn.cn/vant/ipad.png'
  }
])
const activeRoleType = ref('private')
const roleTypeList = ref([
  { name: '私密', value: 'private', count: 0 },
  { name: '公开', value: 'public', count: 0 }
])

// 群聊相关
const groupList = ref([])
const activeGroupType = ref('private')
const groupTypeList = ref([
  { name: '私密', value: 'private', count: 0 },
  { name: '公开', value: 'public', count: 0 }
])

// 状态映射
const STATUS_MAP = {
  1: { text: '审核中', className: 'status-pending' },
  3: { text: '已驳回', className: 'status-rejected' },
  4: { text: '已下架', className: 'status-offline' }
}

function getItemStatusBadge(item) {
  const ps = item?.publishStatus
  if (ps && STATUS_MAP[ps]) return STATUS_MAP[ps]
  if (item?.auditStatusText) return { text: String(item.auditStatusText), className: 'status-pending' }
  return { text: '', className: '' }
}

const defaultActions = [
  { name: '编辑', id: 'edit' },
  { name: '申请发布', id: 'publish' },
  { name: '下架', id: 'offline' },
  { name: '删除', id: 'delete' }
]

function goEditProfile() {
  router.push('/pages/usercenter/edit/index')
}

async function copyId() {
  if (!userInfo.value?.uid) return
  const ok = await copyToClipboard(String(userInfo.value.uid))
  showToast(ok ? '已复制' : '复制失败')
}

function onInviteCodeClick() {
  showDialog({
    title: '填写邀请码',
    message: '请输入邀请码'
  })
}

function onInviteClick() {
  router.push('/pages/share/index')
}

function onScoreClick() {
  router.push('/pages/points/index')
}

function onVipRenewClick() {
  router.push('/pages/vip/packages/index')
}

function onStarYaoJiClick() {
  router.push('/pages/star-yao-ji/index')
}

function onMainTabChange(value) {
  activeMainTab.value = value
  if (value === 'role') loadRoleList()
  else loadGroupList()
}

function onActivityClick() {
  router.push('/pages/vip/packages/index')
}

function goCreateRole() {
  router.push('/pages/role/add/index')
}

function goCreateGroup() {
  router.push('/pages/group/add/index')
}

function onRoleTypeChange(value, idx) {
  activeRoleType.value = value
  loadRoleList()
}

function onGroupTypeChange(value, idx) {
  activeGroupType.value = value
  loadGroupList()
}

function onRoleClick(role) {
  if (role.publishStatus === 3) return showRejectReason(role)
  router.push(`/pages/role/role-detail/index?id=${role.id}`)
}

function onRoleLongPress(role) {
  // 长按操作菜单（仿小程序）
  showActionSheet(defaultActions).then((action) => {
    if (!action) return
    if (action.id === 'edit') {
      router.push(`/pages/role/add/index?id=${role.id}`)
    } else if (action.id === 'publish') {
      applyCharacterPublished({ id: role.id })
        .then(() => {
          showToast('已提交发布申请')
          loadRoleList()
        })
        .catch((e) => showToast(e?.message || '提交失败'))
    } else if (action.id === 'offline') {
      unpublishChar({ id: role.id })
        .then(() => {
          showToast('已下架')
          loadRoleList()
        })
        .catch((e) => showToast(e?.message || '操作失败'))
    } else if (action.id === 'delete') {
      showDialog({ title: '确认删除', message: '此操作不可恢复', showCancelButton: true })
        .then(() => {
          deleteCharacter({ id: role.id })
            .then(() => {
              showToast('已删除')
              loadRoleList()
            })
            .catch((e) => showToast(e?.message || '删除失败'))
        })
        .catch(() => {})
    }
  })
}

function onGroupClick(group) {
  router.push(`/pages/group/detail/index?id=${group.groupChatId}`)
}

function onGroupLongPress(group) {
  showActionSheet(defaultActions).then((action) => {
    if (!action) return
    if (action.id === 'edit') {
      router.push(`/pages/group/add/index?id=${group.groupChatId}`)
    } else if (action.id === 'publish') {
      applyGroupPublish({ groupChatId: group.groupChatId })
        .then(() => {
          showToast('已提交发布申请')
          loadGroupList()
        })
        .catch((e) => showToast(e?.message || '提交失败'))
    } else if (action.id === 'offline') {
      unpublishGroup({ groupChatId: group.groupChatId })
        .then(() => {
          showToast('已下架')
          loadGroupList()
        })
        .catch((e) => showToast(e?.message || '操作失败'))
    } else if (action.id === 'delete') {
      showDialog({ title: '确认删除', message: '此操作不可恢复', showCancelButton: true })
        .then(() => {
          deleteGroup({ groupChatId: group.groupChatId })
            .then(() => {
              showToast('已删除')
              loadGroupList()
            })
            .catch((e) => showToast(e?.message || '删除失败'))
        })
        .catch(() => {})
    }
  })
}

function showRejectReason(role) {
  getAuditRejectReason({ id: role.id })
    .then((res) => {
      showDialog({
        title: '驳回原因',
        message: res?.reason || res?.rejectReason || '请联系客服',
        showCancelButton: false
      })
    })
    .catch(() => {
      showDialog({ title: '无法查看原因', message: '请稍后重试', showCancelButton: false })
    })
}

function showGroupRejectReason(group) {
  getGroupAuditRejectReason({ groupChatId: group.groupChatId })
    .then((res) => {
      showDialog({
        title: '驳回原因',
        message: res?.reason || res?.rejectReason || '请联系客服',
        showCancelButton: false
      })
    })
    .catch(() => {
      showDialog({ title: '无法查看原因', message: '请稍后重试', showCancelButton: false })
    })
}

// 简易 ActionSheet（van-action-sheet）
function showActionSheet(actions) {
  return new Promise((resolve) => {
    showDialog({
      title: '操作',
      message: actions.map((a) => a.name).join(' / '),
      showCancelButton: true,
      confirmButtonText: '编辑'
    })
      .then(() => resolve(actions[0]))
      .catch(() => resolve(null))
  })
}

async function loadRoleList() {
  try {
    const list = await getCharacterList({ type: activeRoleType.value })
    const arr = (list || []).map((it) => ({ ...it, _statusBadge: getItemStatusBadge(it) }))
    roleList.value = arr
    const privateCount = roleTypeList.value[0]
    const publicCount = roleTypeList.value[1]
    roleTypeList.value = [
      { ...privateCount, count: activeRoleType.value === 'private' ? arr.length : roleTypeList.value[0].count },
      { ...publicCount, count: activeRoleType.value === 'public' ? arr.length : roleTypeList.value[1].count }
    ]
  } catch (e) {
    console.warn('loadRoleList failed', e)
  }
}

async function loadGroupList() {
  try {
    const list = await getUserGroupChatList({ type: activeGroupType.value })
    const arr = (list || []).map((it) => ({ ...it, _statusBadge: getItemStatusBadge(it) }))
    groupList.value = arr
  } catch (e) {
    console.warn('loadGroupList failed', e)
  }
}

onMounted(() => {
  loadRoleList()
})
onActivated(() => {
  loadRoleList()
})
</script>

<style lang="scss" scoped>
.usercenter-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    rgb(153, 140, 215) 0%,
    rgb(104, 122, 209) 15%,
    #121212 30%,
    #121212 100%
  );
  color: #fff;
  // padding-bottom: var(--tabbar-height-safearea);
  box-sizing: border-box;
  overflow: hidden;
}

.nav-logo {
  // width: 112rpx;
  height: 35rpx;
  object-fit: contain;
}

.usercenter-content {
  flex: 1;
  min-height: 0;
  padding: 0rpx 12rpx;
  box-sizing: border-box;
  /* 整页不滚动，只有列表内部独立滚动 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.usercenter-list-wrap {
  flex: 1 1 auto;
  /* 浏览器视口宽度不固定（750~1920），vip-box/header 区高度会随宽度变化，
     flex:1 仍可能把空间挤掉。这里给一个最小高度兜底，保证列表始终能滚动 */
  min-height: 200rpx;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 底部留出整个 tabbar 高度，滚动到最后一行时卡片完全展示在 tabbar 上方；
     然后 ::after 再叠一段半透出空间，让用户视觉上"看到"下一张卡片 */
  padding-bottom: var(--tabbar-height-safearea);
}

/* 用户信息 */
.user-info {
  width: 100%;
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  color: #fff;
}

.user-info-avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-right: 20rpx;
}

.user-info-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 2rpx solid #fff;
  object-fit: cover;
}

.user-info-avatar-edit {
  position: absolute;
  right: 0rpx;
  bottom: 0rpx;
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.user-info-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.nickname {
  font-size: 20rpx;
  font-weight: bold;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info-uid {
  font-size: 18rpx;
  color: #ddd;
  display: flex;
  align-items: center;
  margin-top: 4rpx;
}

.id-copy-btn {
  margin-left: 18rpx;
  font-size: 18rpx;
  color: var(--theme-color);
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
}

.user-invite-code {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 2rpx;
}

.user-invite-code-item {
  display: flex;
  align-items: center;
  font-size: 14rpx;
  color: var(--magic-color);
  font-weight: normal;
}

.user-invite-code-icon {
  width: 18rpx;
  height: 18rpx;
  margin-right: 4rpx;
}

.user-info-arr {
  margin-left: auto;
  flex-shrink: 0;
}

/* 积分盒子 */
.score-box {
  width: 100%;
  padding: 0rpx 12rpx;
  margin-top: 12rpx;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  border-radius: 24rpx;
}

.score-box-icon {
  width: 30rpx;
  height: 30rpx;
  margin-right: 12rpx;
}

.score-box-text {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--theme-color-purple);
}

.score-box-desc {
  font-size: 14rpx;
  color: #bbb;
  margin-left: auto;
}

.score-box-arr {
  margin-left: 4rpx;
}

/* VIP 盒子 */
.vip-box {
  width: 100%;
  padding: 12rpx;
  border-radius: 12rpx;
  background: rgba(240, 240, 240, 0.2);
  display: flex;
  align-items: center;
}

.vip-box-left-content {
  flex: 1;
  min-width: 0;
}

.vip-box-header {
  display: flex;
  align-items: center;
}

.vip-box-header-icon {
  width: 40rpx;
  height: 40rpx;
}

.vip-box-header-text {
  margin-left: 12rpx;
  font-weight: bold;
  font-size: 24rpx;
  color: var(--theme-color-purple);
  flex: 1;
}

.open-vip-btn {
  margin-left: auto;
  padding: 4rpx 8rpx;
  background: rgb(214, 190, 217);
  color: var(--magic-color);
  border-radius: 8%;
  font-size: 16rpx;
}

.open-vip-btm-line {
  color: #fff;
  font-weight: bold;
  margin-top: 18rpx;
  font-size: 18rpx;
}

.vip-box-icon {
  margin-left: auto;
  width: 80rpx;
  height: 80rpx;
  flex-shrink: 0;
}

/* 压缩 VIP 盒子的高度，确保列表有足够空间 */
.vip-box-header-icon {
  width: 28rpx;
  height: 28rpx;
}

.open-vip-btm-line {
  color: #fff;
  font-weight: bold;
  margin-top: 6rpx;
  font-size: 18rpx;
}

/* 星耀酒馆入口 */
.star-yao-ji-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 12rpx;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(255, 213, 74, 0.18) 0%, rgba(255, 138, 61, 0.18) 100%);
  border: 1rpx solid rgba(255, 213, 74, 0.25);
}

.star-yao-ji-entry-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.star-yao-ji-entry-icon-wrapper {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #ffd54a 0%, #ff8a3d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(255, 138, 61, 0.4);
}

.star-yao-ji-entry-icon {
  width: 36rpx;
  height: 36rpx;
  background: #fff;
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 8rpx rgba(255, 255, 255, 0.6);

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: linear-gradient(135deg, #ffd54a, #ff8a3d);
    border-radius: 2rpx;
  }

  &::before {
    width: 100%;
    height: 4rpx;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
  }

  &::after {
    width: 4rpx;
    height: 100%;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
  }
}

.star-yao-ji-entry-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.star-yao-ji-entry-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #ffd54a;
  line-height: 1.2;
}

.star-yao-ji-entry-desc {
  font-size: 22rpx;
  color: #ddd;
  margin-top: 6rpx;
  line-height: 1.2;
}

.star-yao-ji-entry-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.star-yao-ji-entry-tag {
  padding: 4rpx 14rpx;
  background: linear-gradient(135deg, #ffd54a 0%, #ff8a3d 100%);
  color: #5a1a00;
  font-size: 22rpx;
  font-weight: bold;
  border-radius: 16rpx;
  margin-right: 8rpx;
}

/* 主 tabs */
.roles-title {
  color: #ddd;
  font-size: 16rpx;
  padding: 8rpx;
  display: flex;
  align-items: center;
}

.type-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8rpx 0;
}


.title-desc {
  font-size: 14rpx;
  color: #999;
  margin-left: 12rpx;
  margin-left: auto;
}

.content-tabs {
  display: inline-flex;
  align-items: center;
  height: 40rpx;
  white-space: nowrap;
}

.content-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  height: 38rpx;
  font-size: 18rpx;
  font-weight: bold;
  color: #999;
  white-space: nowrap;
  cursor: pointer;
}

.content-tab.active {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
}

.content-tab-underline {
  position: absolute;
  bottom: 0rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2rpx;
}

.content-tab-red-dot {
  position: absolute;
  top: 10rpx;
  right: 12rpx;
  width: 16rpx;
  height: 16rpx;
  background-color: #ff4949;
  border-radius: 50%;
}

/* 智能体 type tabs */
.role-type-tabs {
  width: 100%;
  display: inline-flex;
  height: 40rpx;
  white-space: nowrap;
  padding-bottom: 10rpx;
}

.role-type-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx 10rpx;
  font-size: 18rpx;
  font-weight: bold;
  color: #999;
  white-space: nowrap;
  margin-left: 10rpx;
  cursor: pointer;
  transition: all 0.3s;
}

.role-type-tab.active {
  background: rgba(240, 240, 240, 0.2);
  border-radius: 18rpx;
  color: #fff;
}

/* role list */
.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

/* 列表最后增加一段"半透出"空间，让用户能看到下一张卡的轮廓。
   视觉上叠在 tabbar 上（约占 tabbar 一半高度）
   （list-wrap 自身已经预留了完整 tabbar 高度做 padding-bottom，
     这里再加额外占位让滚动观感更顺） */
.role-list::after,
.group-list::after {
  content: '';
  flex-basis: 100%;
  height: calc(var(--tabbar-height-safearea) * 0.2);
  pointer-events: none;
}

.role-card {
  width: calc(33.333% - 12rpx);
  aspect-ratio: 0.618;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  overflow: hidden;
  backdrop-filter: blur(10px);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  cursor: pointer;
}

.reject-reason-btn {
  position: absolute;
  left: 12rpx;
  top: 12rpx;
  padding: 4rpx;
  border: 1rpx solid #ee5a6f;
  background: rgba(248, 113, 113, 0.1);
  color: #ee5a6f;
  border-radius: 12rpx;
  font-size: 20rpx;
  z-index: 2;
}

.role-status-ribbon {
  position: absolute;
  top: 18rpx;
  right: -44rpx;
  z-index: 2;
  width: 160rpx;
  height: 44rpx;
  line-height: 44rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 700;
  transform: rotate(45deg);
  transform-origin: center;
  border-radius: 8rpx;
  box-shadow: 0 8rpx 18rpx rgba(0, 0, 0, 0.35);
  letter-spacing: 1rpx;
}

.role-status-ribbon.status-pending {
  background: linear-gradient(135deg, rgba(26, 106, 255, 0.5) 0%, rgba(26, 106, 255, 0.22) 100%);
  color: #0361ee;
}

.role-status-ribbon.status-approved {
  background: linear-gradient(135deg, rgba(110, 243, 181, 0.26) 0%, rgba(23, 201, 100, 0.26) 100%);
  color: #063a1e;
}

.role-status-ribbon.status-rejected {
  background: linear-gradient(135deg, rgba(253, 10, 10, 0.5) 0%, rgba(253, 10, 10, 0.24) 100%);
  color: #f32d2d;
}

.role-status-ribbon.status-offline {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.52) 0%, rgba(200, 200, 200, 0.20) 100%);
  color: #aaa;
}

.role-info {
  padding: 16rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
  position: relative;
  z-index: 1;
}

.role-name-row {
  display: flex;
  align-items: center;
}

.role-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-hot {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.85);
}

.role-empty-state {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 12rpx;
  color: #999;
}

.empty-text {
  font-size: 16rpx;
  font-weight: 600;
  color: #ddd;
  margin-top: 24rpx;
}

.author-btn {
  color: var(--magic-color);
}

.empty-desc {
  font-size: 16rpx;
  color: var(--magic-color);
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  font-weight: bold;
}

.role-create-btn {
  margin-right: 12rpx;
}

/* group list */
.group-type-tabs {
  width: 100%;
  display: inline-flex;
  height: 40rpx;
  white-space: nowrap;
  padding-bottom: 10rpx;
}

.group-type-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx 10rpx;
  font-size: 18rpx;
  font-weight: bold;
  color: #999;
  white-space: nowrap;
  margin-left: 10rpx;
  cursor: pointer;
  transition: all 0.3s;
}

.group-type-tab.active {
  background: rgba(240, 240, 240, 0.2);
  border-radius: 18rpx;
  color: #fff;
}

.group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.group-card {
  width: calc(33.333% - 12rpx);
  aspect-ratio: 0.618;
  background-color: #06080f;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  isolation: isolate;
}

.group-card-avatar {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.group-card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-reject-reason-btn {
  position: absolute;
  left: 12rpx;
  top: 12rpx;
  padding: 4rpx;
  border: 1rpx solid #ee5a6f;
  background: rgba(248, 113, 113, 0.1);
  color: #ee5a6f;
  border-radius: 12rpx;
  font-size: 20rpx;
  z-index: 4;
}

.group-status-ribbon {
  position: absolute;
  top: 18rpx;
  right: -44rpx;
  z-index: 2;
  width: 160rpx;
  height: 44rpx;
  line-height: 44rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 700;
  transform: rotate(45deg);
  transform-origin: center;
  border-radius: 8rpx;
  box-shadow: 0 8rpx 18rpx rgba(0, 0, 0, 0.35);
  letter-spacing: 1rpx;
}

.group-status-ribbon.status-pending {
  background: linear-gradient(135deg, rgba(26, 106, 255, 0.5) 0%, rgba(26, 106, 255, 0.22) 100%);
  color: #0361ee;
}

.group-status-ribbon.status-rejected {
  background: linear-gradient(135deg, rgba(253, 10, 10, 0.5) 0%, rgba(253, 10, 10, 0.24) 100%);
  color: #f32d2d;
}

.group-status-ribbon.status-offline {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.52) 0%, rgba(200, 200, 200, 0.20) 100%);
  color: #aaa;
}

.group-info {
  padding: 16rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.45) 50%, transparent 100%);
  position: relative;
  z-index: 3;
}

.group-name-row {
  display: flex;
  align-items: center;
}

.group-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-empty-state {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 32rpx;
  color: #999;
}
</style>
