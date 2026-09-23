// 主题 Store（深色 / 浅色 / 跟随系统）
// 通过给 <html> 设置 data-theme 属性驱动全局 CSS 变量切换
import { defineStore } from 'pinia'

const STORAGE_KEY = 'app-theme'
const VALID_THEMES = ['light', 'dark', 'system']

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  const effective = theme === 'system' ? getSystemTheme() : theme
  html.setAttribute('data-theme', effective)
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light' // 'light' | 'dark' | 'system'
  }),

  getters: {
    isDark: (state) => {
      if (state.theme === 'system') return getSystemTheme() === 'dark'
      return state.theme === 'dark'
    },
    themeLabel: (state) => {
      switch (state.theme) {
        case 'dark': return '深色'
        case 'system': return '跟随系统'
        default: return '浅色'
      }
    }
  },

  actions: {
    init() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && VALID_THEMES.includes(saved)) {
          this.theme = saved
        }
      } catch (e) {}
      applyTheme(this.theme)
      this._watchSystem()
    },

    setTheme(theme) {
      if (!VALID_THEMES.includes(theme)) return
      this.theme = theme
      try {
        localStorage.setItem(STORAGE_KEY, theme)
      } catch (e) {}
      applyTheme(theme)
    },

    toggle() {
      const next = this.isDark ? 'light' : 'dark'
      this.setTheme(next)
    },

    _watchSystem() {
      if (typeof window === 'undefined' || !window.matchMedia) return
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        if (this.theme === 'system') applyTheme('system')
      }
      if (mq.addEventListener) mq.addEventListener('change', handler)
      else if (mq.addListener) mq.addListener(handler)
    }
  }
})
