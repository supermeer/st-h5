// 全局鉴权跳转桥接：把任意页面上的「需要登录」操作统一转换为
// 跳转到 web 邮箱登录页（/pages/login/index），登录成功后回到来源路径。
//
// 使用：
//   import { navigateToLogin } from '@/utils/auth-bridge'
//   navigateToLogin({ redirect: '/pages/share/index?isShare=1' })
//
// 也可以通过监听全局事件 h5:show-login-modal 触发跳转，
// 业务代码继续 dispatch 即可：
//   window.dispatchEvent(new CustomEvent('h5:show-login-modal', { detail: { redirect } }))

import router from '@/router'

const LOGIN_PATH = '/pages/login/index'

/**
 * 跳转到 web 登录页
 * @param {{ redirect?: string, replace?: boolean }} [options]
 */
export function navigateToLogin(options = {}) {
  const { redirect, replace = true } = options
  const currentPath = router.currentRoute.value.fullPath
  // 已在登录页则不重复跳转
  if (router.currentRoute.value.path === LOGIN_PATH) return
  const query = {
    redirect: redirect || currentPath || '/pages/home/home'
  }
  if (replace) {
    router.replace({ path: LOGIN_PATH, query })
  } else {
    router.push({ path: LOGIN_PATH, query })
  }
}

/**
 * 安装全局事件监听：把 h5:show-login-modal 事件桥接到 navigateToLogin
 * 建议在 App 入口（main.js 或 App.vue 的 setup）调用一次
 */
export function setupAuthBridge() {
  if (typeof window === 'undefined') return
  window.addEventListener('h5:show-login-modal', (e) => {
    const redirect = e?.detail?.redirect
    navigateToLogin({ redirect })
  })
}
