// system.js —— 系统信息工具（对应小程序 utils/system.js）
// H5 没有原生状态栏；如有需要通过 env(safe-area-inset-top) 由 CSS 取值

let cachedSystemInfo = null

function getSystemInfoSync() {
  if (cachedSystemInfo) return cachedSystemInfo
  cachedSystemInfo = {
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    // H5 没有状态栏，使用 iOS 刘海/灵动岛区域作为参考
    statusBarHeight: getCssSafeAreaTop(),
    platform: 'h5',
    safeArea: {
      top: getCssSafeAreaTop(),
      bottom: window.innerHeight - getCssSafeAreaBottom(),
      left: 0,
      right: window.innerWidth
    }
  }
  return cachedSystemInfo
}

function getCssSafeAreaTop() {
  // iOS Safari 支持 env(safe-area-inset-top)
  const tmp = document.createElement('div')
  tmp.style.cssText =
    'position:fixed;top:env(safe-area-inset-top);bottom:env(safe-area-inset-bottom);left:env(safe-area-inset-left);right:env(safe-area-inset-right);pointer-events:none;visibility:hidden;'
  document.body.appendChild(tmp)
  const rect = tmp.getBoundingClientRect()
  document.body.removeChild(tmp)
  return Math.max(0, Math.round(rect.top))
}

function getCssSafeAreaBottom() {
  const tmp = document.createElement('div')
  tmp.style.cssText =
    'position:fixed;top:env(safe-area-inset-top);bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;'
  document.body.appendChild(tmp)
  const rect = tmp.getBoundingClientRect()
  document.body.removeChild(tmp)
  return Math.max(0, Math.round(window.innerHeight - rect.bottom))
}

function getPageInfo() {
  // 与小程序保持一致的字段命名
  const statusBarHeight = getSystemInfoSync().statusBarHeight || 20
  return {
    navHeight: statusBarHeight + 44,
    statusBarHeight,
    safeAreaTop: statusBarHeight,
    safeAreaBottom: getCssSafeAreaBottom(),
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
      safeAreaBottom: getCssSafeAreaBottom()
    })
  window.addEventListener('resize', handler)
  // 屏幕方向变化也触发
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
