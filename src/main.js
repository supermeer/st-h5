// 入口文件（对应小程序的 app.js）
// 1. 创建应用并注册 Pinia / Vue Router / 全局样式
// 2. 模拟 App.onLaunch：从 localStorage 恢复用户登录态
// 3. 注册全局 wx 适配层（业务代码无需 import wx）
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user'
import { useThemeStore } from './store/theme'
import { wx as wxAdapter } from './utils/wx-adapter'
import { setupVConsole } from './utils/vconsole'
import { setupWechat } from './utils/wechat-jssdk'
import { setupAuthBridge } from './utils/auth-bridge'

// 全局组件
import CustomNav from '@/components/CustomNav.vue'

// Vant 全局样式
import 'vant/lib/index.css'
import { showToast, showLoadingToast, closeToast, showDialog } from 'vant'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 全局注册自定义组件
app.component('CustomNav', CustomNav)

// 全局挂载 wx 适配层（在 Vue 组件和 JS 模块中均可直接使用 wx.xxx）
app.config.globalProperties.$wx = wxAdapter
// 同时挂到 window（兼容直接访问 window.wx 的场景）
window.wx = wxAdapter

// Vant 命令式 API
app.config.globalProperties.$vant = { showToast, showLoadingToast, closeToast, showDialog }

// ============ 监听 401 事件（对应小程序 wx.request 拦截器触发登录弹窗）============
window.addEventListener('h5:auth-required', () => {
  const userStore = useUserStore()
  userStore.clearAuth()
  userStore.setLoginMark(true)
  // 跳转到 web 登录页（由 setupAuthBridge 监听 h5:show-login-modal 处理）
  window.dispatchEvent(new CustomEvent('h5:show-login-modal'))
})

// 统一鉴权跳转桥接：把 h5:show-login-modal 全局事件统一跳转到 web 登录页
// 必须在 App mount 之前安装，否则路由未就绪
setupAuthBridge()

// 模拟小程序 App.onLaunch：恢复用户登录态 + 应用主题
const userStore = useUserStore()
userStore.initFromLocal()
const themeStore = useThemeStore()
themeStore.init()

app.mount('#app')

// VConsole 调试（开发模式自动启用 / URL ?vconsole=1 / localStorage vconsole=1）
setupVConsole()

// 微信内自动注入 JSSDK
setupWechat()
