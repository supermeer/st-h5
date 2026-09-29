// system.js —— 系统信息工具（对应小程序 utils/system.js）
//
// 【H5 实现说明】
// H5 没有原生状态栏。安全区在 CSS 端由 tokens.scss 的 --safearea-* 变量管理，
// 该变量通过 env(safe-area-inset-*) 实时计算，浏览器自动响应 resize/orientationchange。
// 因此本文件不再用 DOM 测距去"测量" safearea 值，保留的工具函数只提供尺寸查询。
//
// 旧实现（getCssSafeAreaTop/Bottom）已废弃，保留为 stub 以防外部 import 报错。

let cachedSystemInfo = null

function getSystemInfoSync() {
  if (cachedSystemInfo) return cachedSystemInfo
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = window.devicePixelRatio || 1
  cachedSystemInfo = {
    screenWidth: w,
    screenHeight: h,
    windowWidth: w,
    windowHeight: h,
    pixelRatio: dpr,
    // H5 没有原生状态栏；真实安全区由 CSS --safearea-top 提供
    statusBarHeight: 0,
    platform: 'h5',
    safeArea: { top: 0, bottom: h, left: 0, right: w, width: w, height: h }
  }
  return cachedSystemInfo
}

// 兼容旧调用：返回 0，业务已迁移到 CSS 变量
function getCssSafeAreaTop() {
  return 0
}
function getCssSafeAreaBottom() {
  return 0
}

function getPageInfo() {
  // 兼容旧调用：navHeight 仍按 44 + statusBar 估算，H5 真实高度由 CustomNav 的 CSS 决定
  const statusBarHeight = 0
  return {
    navHeight: statusBarHeight + 44,
    statusBarHeight,
    safeAreaTop: statusBarHeight,
    safeAreaBottom: 0,
    tabbarHeight: 50
  }
}

function getContentHeight() {
  const info = getPageInfo()
  const totalHeight = window.innerHeight
  return totalHeight - info.navHeight - info.safeAreaTop - info.safeAreaBottom
}

function getSafeArea() {
  return getSystemInfoSync().safeArea
}

function getBottomSafeHeight() {
  const sa = getSafeArea()
  if (!sa) return 0
  return Math.max(0, window.innerHeight - sa.bottom)
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent)
}

function isDevTools() {
  return false
}

const DEVICE_TYPE = { IOS: 'ios', ANDROID: 'android', DEVTOOLS: 'devtools', UNKNOWN: 'unknown' }

function observeViewportChange(callback) {
  if (typeof callback !== 'function') return () => {}
  const handler = () =>
    callback({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      safeAreaBottom: 0
    })
  window.addEventListener('resize', handler)
  window.addEventListener('orientationchange', handler)
  return () => {
    window.removeEventListener('resize', handler)
    window.removeEventListener('orientationchange', handler)
  }
}

function getDeviceType() {
  return 'h5'
}

export {
  getPageInfo,
  getContentHeight,
  getSafeArea,
  getBottomSafeHeight,
  getSystemInfoSync as getSystemInfo,
  isIOS,
  isAndroid,
  isDevTools,
  DEVICE_TYPE,
  observeViewportChange,
  getDeviceType
}
