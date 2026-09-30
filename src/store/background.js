// 全局背景 Store
// 统一管理聊天页 / 首页 / 群聊页等场景下的"剧情背景图"。
// 背景由 <AppBackground /> 全局组件渲染（position: fixed 铺满视口），
// 不再依赖各个页面自己写 backgroundImage / page-bg 容器，
// 避免出现"内容把背景撑大 / 背景随滚动"等问题。
import { defineStore } from 'pinia'

export const useBackgroundStore = defineStore('background', {
  state: () => ({
    // 当前剧情背景图 URL
    currentBg: '',
    // 是否启用背景图（对应 localStorage 'aE' === '0' 时关闭）
    enabled: true
  }),

  getters: {
    // 是否真正可见：有图 + 已启用
    shouldShow: (state) => state.enabled && !!state.currentBg
  },

  actions: {
    /**
     * 设置当前剧情背景
     * @param {string} bg 图片 URL（传空字符串表示清除）
     */
    setBg(bg) {
      this.currentBg = bg || ''
    },

    /**
     * 清除当前背景（用于切页 / 退出聊天等）
     */
    clearBg() {
      this.currentBg = ''
    },

    /**
     * 启用 / 禁用背景图（用户开关）
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
      this.enabled = !!enabled
    }
  }
})
