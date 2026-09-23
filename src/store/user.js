// 用户 Store（对应小程序 store/user.js）
// 使用 Pinia 复刻 westore 的 userStore
import { defineStore } from 'pinia'
import { getMyVipInfo } from '@/api/usercenter'
import { getMyPointInfo } from '@/api/vip'

const DEFAULT_USER = {
  avatarUrl: '',
  nickname: '',
  uid: '',
  phone: '',
  state: '',
  id: null,
  openId: null
}

const DEFAULT_VIP_INFO = {
  giftRemaining: 0,
  monthlyExpireTime: 0,
  monthlyRemaining: 0,
  ifVip: false,
  monthlyRemainingDays: 0,
  formattedMonthlyExpireTime: ''
}

const DEFAULT_POINT_INFO = {
  dailyFreeBalance: 0,
  dailyFreeBalancePreset: 0,
  pointBalance: 0
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    loginMark: false,
    vipInfo: null,
    pointInfo: null
  }),

  getters: {
    isLogin: (state) => !!state.userInfo && !!state.userInfo.id
  },

  actions: {
    // 从 localStorage 恢复登录态（对应 westore.initFromLocal）
    initFromLocal() {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        const vipInfo = JSON.parse(localStorage.getItem('vipInfo') || 'null')
        const pointInfo = JSON.parse(localStorage.getItem('pointInfo') || 'null')
        this.userInfo = user || null
        this.vipInfo = vipInfo || null
        this.pointInfo = pointInfo || null
        this._injectDefaultsIfMissing()
      } catch (e) {
        console.error('userStore.initFromLocal 失败', e)
      }
    },

    _injectDefaultsIfMissing() {
      if (typeof this.vipInfo === 'undefined' || this.vipInfo === null) {
        this.vipInfo = { ...DEFAULT_VIP_INFO }
      }
      if (typeof this.pointInfo === 'undefined' || this.pointInfo === null) {
        this.pointInfo = { ...DEFAULT_POINT_INFO }
      }
      if (!this.userInfo) {
        this.userInfo = { ...DEFAULT_USER }
      }
    },

    setLoginMark(mark) {
      this.loginMark = !!mark
    },

    // 登录成功后写入 token / 用户信息，并刷新 VIP / 积分
    async setLoginSuccess(payload = {}) {
      const { user, token, openId } = payload
      if (token) localStorage.setItem('token', token)
      if (openId) localStorage.setItem('openId', openId)
      if (user) localStorage.setItem('user', JSON.stringify(user))
      this.userInfo = user || this.userInfo || { ...DEFAULT_USER }
      this.loginMark = false
      this.refreshVipInfo()
      this.refreshPointInfo()
    },

    async refreshVipInfo() {
      try {
        const res = await getMyVipInfo()
        const date = new Date(res.monthlyExpireTime)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        this.vipInfo = {
          ...(this.vipInfo || {}),
          ...res,
          formattedMonthlyExpireTime: `${year}年${month}月${day}日`
        }
        localStorage.setItem('vipInfo', JSON.stringify(this.vipInfo))
      } catch (e) {
        console.error('refreshVipInfo 失败', e)
      }
    },

    async refreshPointInfo() {
      try {
        const res = await getMyPointInfo()
        this.pointInfo = { ...(this.pointInfo || {}), ...res }
        localStorage.setItem('pointInfo', JSON.stringify(this.pointInfo))
      } catch (e) {
        console.error('refreshPointInfo 失败', e)
      }
    },

    updateUser(partial = {}) {
      this.userInfo = { ...(this.userInfo || DEFAULT_USER), ...partial }
      try {
        localStorage.setItem('user', JSON.stringify(this.userInfo))
      } catch (e) {}
    },

    updateVipInfo(vipInfo) {
      this.vipInfo = vipInfo
      try {
        localStorage.setItem('vipInfo', JSON.stringify(vipInfo))
      } catch (e) {}
    },

    updatePointInfo(pointInfo) {
      this.pointInfo = pointInfo
      try {
        localStorage.setItem('pointInfo', JSON.stringify(pointInfo))
      } catch (e) {}
    },

    // 清除登录态（401 时调用）
    clearAuth() {
      localStorage.removeItem('token')
      localStorage.removeItem('openId')
      localStorage.removeItem('user')
      localStorage.removeItem('vipInfo')
      this.userInfo = null
      this.vipInfo = null
    }
  }
})
