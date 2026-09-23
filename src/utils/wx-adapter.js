// wx-adapter.js —— 微信小程序 API 的浏览器/H5 适配层
// 对应小程序项目中所有 wx.* 调用
//
// 使用方式：在 main.js 中 import 并 attach 到 window.wx，
// 之后任何 vue 文件 / store / 工具中调用 wx.xxx 都走这里
//
// 实现原则：
// 1) 与微信 API 同名同形参；返回 Promise 或 {success/fail/complete} 回调对象
// 2) 业务代码无需修改即可运行
// 3) 关键能力（路由 / 存储 / Toast / 请求）走真实实现，部分能力（扫码/同声传译等）用浏览器替代或 stub

import { showToast as vantShowToast, showLoadingToast, closeToast, showDialog, showConfirmDialog } from 'vant'
import { getRouter } from './router-bridge'

// ========== 路由 / 页面 ==========
const _router = () => getRouter()

function navigateTo({ url, success, fail, complete }) {
  try {
    const path = url.split('?')[0].replace(/^\//, '/')
    // navigateBack delta 默认 1
    _router().push(url).then(
      () => success && success({ eventChannel: {} }),
      (err) => {
        fail && fail(err)
        complete && complete()
      }
    )
    complete && setTimeout(complete, 0)
  } catch (e) {
    fail && fail(e)
  }
}

function redirectTo({ url, success, fail, complete }) {
  try {
    _router().replace(url).then(
      () => success && success(),
      (err) => fail && fail(err)
    )
    complete && setTimeout(complete, 0)
  } catch (e) {
    fail && fail(e)
  }
}

function switchTab({ url, success, fail, complete }) {
  try {
    _router().push(url).then(
      () => success && success(),
      (err) => fail && fail(err)
    )
    complete && setTimeout(complete, 0)
  } catch (e) {
    fail && fail(e)
  }
}

function reLaunch({ url, success, fail, complete }) {
  try {
    _router().replace(url).then(
      () => {
        success && success()
        complete && complete()
      },
      (err) => fail && fail(err)
    )
  } catch (e) {
    fail && fail(e)
  }
}

function navigateBack({ delta = 1, success, fail, complete }) {
  try {
    _router().go(-delta)
    success && success()
    complete && complete()
  } catch (e) {
    fail && fail(e)
  }
}

// ========== Storage ==========
// 小程序 setStorageSync 支持存字符串、对象、number、boolean，统一 JSON.stringify 即可
function _serialize(val) {
  if (val === undefined) return ''
  if (val === null) return ''
  return typeof val === 'string' ? val : JSON.stringify(val)
}
function _deserialize(val) {
  if (val === '' || val === null || val === undefined) return ''
  // 数字 / 布尔直接返回
  if (typeof val !== 'string') return val
  // 尝试解析 JSON
  if (val.startsWith('{') || val.startsWith('[') || val === 'true' || val === 'false' || val === 'null' || /^-?\d/.test(val)) {
    try {
      return JSON.parse(val)
    } catch (e) {
      return val
    }
  }
  return val
}

const getStorageSync = (key) => {
  try {
    return _deserialize(localStorage.getItem(key))
  } catch (e) {
    return ''
  }
}
const setStorageSync = (key, val) => {
  try {
    localStorage.setItem(key, _serialize(val))
  } catch (e) {}
}
const removeStorageSync = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (e) {}
}
const getStorage = ({ key, success, fail }) => {
  try {
    success && success({ data: getStorageSync(key) })
  } catch (e) {
    fail && fail(e)
  }
}
const setStorage = ({ key, data, success, fail }) => {
  try {
    setStorageSync(key, data)
    success && success({ data })
  } catch (e) {
    fail && fail(e)
  }
}

// ========== Toast / Loading / Modal / ActionSheet ==========
// 微信 icon: success / error / loading / none
const _toVantIcon = (icon) => {
  if (icon === 'success') return 'success'
  if (icon === 'error') return 'fail'
  if (icon === 'loading') return 'loading'
  return undefined // none
}

function showToast({ title, icon = 'none', duration = 1500, mask = false, success, fail }) {
  try {
    const vIcon = _toVantIcon(icon)
    if (icon === 'loading') {
      showLoadingToast({ message: title, duration, forbidClick: mask })
    } else {
      vantShowToast({ message: title, type: vIcon, duration, forbidClick: mask })
    }
    success && success()
  } catch (e) {
    fail && fail(e)
  }
}

function showLoading({ title = '加载中...', mask = false, success, fail }) {
  try {
    showLoadingToast({ message: title, forbidClick: mask })
    success && success()
  } catch (e) {
    fail && fail(e)
  }
}

function hideLoading({ success, fail }) {
  try {
    closeToast()
    success && success()
  } catch (e) {
    fail && fail(e)
  }
}

function showModal({
  title = '提示',
  content = '',
  showCancel = true,
  cancelText = '取消',
  cancelColor = '#000000',
  confirmText = '确定',
  confirmColor = '#FA550F',
  success,
  fail
}) {
  try {
    if (showCancel) {
      showConfirmDialog({
        title,
        message: content,
        cancelButtonText: cancelText,
        confirmButtonText: confirmText,
        confirmButtonColor: confirmColor
      })
        .then(() => success && success({ confirm: true, cancel: false }))
        .catch(() => success && success({ confirm: false, cancel: true }))
    } else {
      showDialog({
        title,
        message: content,
        confirmButtonText: confirmText,
        confirmButtonColor: confirmColor
      })
        .then(() => success && success({ confirm: true, cancel: false }))
        .catch(() => success && success({ confirm: false, cancel: true }))
    }
  } catch (e) {
    fail && fail(e)
  }
}

function showActionSheet({ itemList = [], success, fail, complete }) {
  try {
    // Vant 的 ActionSheet 用法略有不同；这里退化为 Vant 的 showActionSheet
    // 浏览器 H5 中实际常见做法是用一个底部弹层，这里用 Vant 实现
    const choices = itemList.map((it, idx) => ({ name: typeof it === 'string' ? it : it.text || String(it), idx }))
    // 使用 Vant 命令式 API
    import('vant').then(({ showActionSheet: vShow }) => {
      vShow({
        actions: choices.map((c) => ({ name: c.name })),
        cancelText: '取消'
      })
        .then((res) => {
          const idx = choices.findIndex((c) => c.name === res.name)
          success && success({ tapIndex: idx >= 0 ? idx : 0 })
          complete && complete()
        })
        .catch(() => {
          fail && fail()
          complete && complete()
        })
    })
  } catch (e) {
    fail && fail(e)
  }
}

// ========== 系统信息 ==========
let _cachedSys = null
function getSystemInfoSync() {
  if (_cachedSys) return _cachedSys
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = window.devicePixelRatio || 1
  _cachedSys = {
    screenWidth: w,
    screenHeight: h,
    windowWidth: w,
    windowHeight: h,
    pixelRatio: dpr,
    statusBarHeight: 0, // H5 没有原生状态栏高度，按 0 处理
    platform: 'h5',
    system: navigator.userAgent,
    model: 'H5',
    safeArea: { top: 0, bottom: h, left: 0, right: w, width: w, height: h },
    SDKVersion: '2.0.0',
    language: navigator.language
  }
  return _cachedSys
}

function getSystemInfo({ success }) {
  success && success(getSystemInfoSync())
}

function getWindowInfo() {
  const s = getSystemInfoSync()
  return { ...s, safeAreaBottom: 0 }
}

function getAccountInfoSync() {
  // H5 中无法获取真正的账号信息，返回 mock
  return {
    miniProgram: { envVersion: 'release', version: '2.0.0', appId: 'wx-h5-mock' }
  }
}

function canIUse(api) {
  // 浏览器中默认支持大多数 API，遇到特殊 API 返回 false
  if (api === 'getUpdateManager') return false
  if (api === 'getBluetoothAdapter') return false
  return true
}

// ========== 网络请求 / 上传 / 下载 ==========
// 完整实现在 src/api/http.js，这里只暴露一个最小包装以适配 wx.request 风格的调用
async function request(options) {
  const { url, method = 'GET', data, header, success, fail, complete } = options
  try {
    const { default: http } = await import('@/api/http')
    const res = await http.request({
      url,
      method: method.toUpperCase(),
      data,
      headers: header,
      _raw: true // 透传，避免被业务拦截器吞掉 statusCode
    })
    const wrapped = {
      data: res,
      statusCode: 200,
      header: res && res.headers ? res.headers : {}
    }
    success && success(wrapped)
    complete && complete(wrapped)
  } catch (err) {
    const wrapped = {
      data: err && err.data,
      statusCode: err && err.statusCode ? err.statusCode : 0,
      errMsg: (err && err.message) || 'request:fail'
    }
    fail && fail(wrapped)
    complete && complete(wrapped)
  }
}

async function uploadFile({ url, filePath, name = 'file', formData = {}, header, success, fail, complete }) {
  try {
    const { default: http } = await import('@/api/http')
    const fd = new FormData()
    if (formData) {
      Object.keys(formData).forEach((k) => fd.append(k, formData[k]))
    }
    // filePath 可能是文件路径、URL 或 File 对象
    if (filePath instanceof File) {
      fd.append(name, filePath)
    } else if (typeof filePath === 'string') {
      // 远程 URL 或本地路径：fetch 一下拿到 blob 再 append
      const r = await fetch(filePath)
      const blob = await r.blob()
      fd.append(name, blob, filePath.split('/').pop())
    } else {
      fd.append(name, filePath)
    }
    const headers = { 'Content-Type': 'multipart/form-data', ...(header || {}) }
    const res = await http.request({
      url,
      method: 'POST',
      data: fd,
      headers
    })
    success && success({ data: res, statusCode: 200 })
    complete && complete()
  } catch (e) {
    fail && fail({ errMsg: e.message || 'uploadFile:fail' })
    complete && complete()
  }
}

async function downloadFile({ url, success, fail, complete }) {
  try {
    const r = await fetch(url)
    const blob = await r.blob()
    const objectUrl = URL.createObjectURL(blob)
    success && success({ tempFilePath: objectUrl, statusCode: 200 })
    complete && complete()
  } catch (e) {
    fail && fail({ errMsg: e.message || 'downloadFile:fail' })
    complete && complete()
  }
}

// ========== 选择媒体 / 图片 ==========
// H5 用 <input type="file"> 替代
function chooseImage({ count = 1, sizeType = ['original', 'compressed'], sourceType = ['album', 'camera'], success, fail, complete }) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = count > 1
  input.style.display = 'none'
  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) {
      complete && complete()
      return
    }
    const paths = files.map((f) => ({
      path: URL.createObjectURL(f),
      rawFile: f,
      size: f.size
    }))
    success && success({ tempFilePaths: paths.map((p) => p.path), tempFiles: paths })
    complete && complete()
    document.body.removeChild(input)
  })
  input.addEventListener('cancel', () => {
    fail && fail({ errMsg: 'chooseImage:fail cancel' })
    complete && complete()
    document.body.removeChild(input)
  })
  document.body.appendChild(input)
  input.click()
}

function chooseMedia({ count = 1, mediaType = ['image', 'video'], sourceType = ['album', 'camera'], success, fail, complete }) {
  const accept = mediaType.includes('video') ? 'image/*,video/*' : 'image/*'
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = count > 1
  input.style.display = 'none'
  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) {
      complete && complete()
      return
    }
    const result = files.map((f) => ({
      tempFilePath: URL.createObjectURL(f),
      rawFile: f,
      size: f.size,
      type: f.type.startsWith('video') ? 'video' : 'image',
      duration: 0,
      width: 0,
      height: 0
    }))
    success && success({ tempFiles: result })
    complete && complete()
    document.body.removeChild(input)
  })
  document.body.appendChild(input)
  input.click()
}

function getImageInfo({ src, success, fail }) {
  const img = new Image()
  img.onload = () => {
    success && success({
      width: img.naturalWidth,
      height: img.naturalHeight,
      path: src,
      type: 'png',
      orientation: 'up'
    })
  }
  img.onerror = (e) => fail && fail({ errMsg: 'getImageInfo:fail', error: e })
  img.src = src
}

// ========== 剪贴板 / 振动 / 预览图片 ==========
function setClipboardData({ data, success, fail }) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(data).then(
        () => success && success({ data }),
        (e) => fail && fail(e)
      )
    } else {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = data
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) success && success({ data })
      else fail && fail({ errMsg: 'setClipboardData:fail' })
    }
  } catch (e) {
    fail && fail(e)
  }
}

function getClipboardData({ success, fail }) {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(
        (data) => success && success({ data }),
        (e) => fail && fail(e)
      )
    } else {
      fail && fail({ errMsg: 'not supported' })
    }
  } catch (e) {
    fail && fail(e)
  }
}

function vibrateShort({ type = 'medium', success, fail }) {
  try {
    if (navigator.vibrate) {
      const ms = type === 'heavy' ? 30 : type === 'light' ? 5 : 15
      navigator.vibrate(ms)
      success && success()
    } else {
      fail && fail({ errMsg: 'vibrate not supported' })
    }
  } catch (e) {
    fail && fail(e)
  }
}

function vibrateLong({ success, fail }) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(400)
      success && success()
    } else {
      fail && fail({ errMsg: 'vibrate not supported' })
    }
  } catch (e) {
    fail && fail(e)
  }
}

function previewImage({ urls, current, success, fail }) {
  try {
    // H5 中直接新窗口打开
    const url = current || (urls && urls[0])
    if (url) {
      window.open(url, '_blank')
      success && success()
    } else {
      fail && fail({ errMsg: 'no urls' })
    }
  } catch (e) {
    fail && fail(e)
  }
}

// ========== 客服 / 登录 / 设置 ==========
function openCustomerServiceChat({ url, corpId, success, fail }) {
  try {
    // H5 直接跳转 URL
    if (url) {
      window.open(url, '_blank')
    } else if (corpId) {
      window.open(`https://work.weixin.qq.com/kfid/${corpId}`, '_blank')
    }
    success && success()
  } catch (e) {
    fail && fail(e)
  }
}

function login({ success, fail }) {
  // H5 中没有 wx.login；返回一个 mock
  console.warn('[wx-adapter] wx.login 在 H5 中不可用，返回 mock code')
  setTimeout(() => success && success({ code: 'mock-h5-code-' + Date.now() }), 100)
}

function getSetting({ success, fail }) {
  // H5 默认通过
  success && success({ authSetting: {} })
}

function authorize({ scope, success, fail }) {
  console.warn('[wx-adapter] wx.authorize 在 H5 中默认通过 scope=', scope)
  success && success()
}

function openSetting({ success, fail }) {
  success && success({ authSetting: {} })
}

function getUserProfile({ desc, success, fail }) {
  // H5 中需要业务方自行实现
  console.warn('[wx-adapter] wx.getUserProfile 需要业务方实现')
  success && success({
    userInfo: {
      nickName: 'H5用户',
      avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKvNx/132',
      gender: 0,
      country: '',
      province: '',
      city: '',
      language: 'zh_CN'
    }
  })
}

// ========== 文件系统 / Canvas ==========
function getFileSystemManager() {
  return {
    readFile({ filePath, encoding, success, fail }) {
      fetch(filePath)
        .then((r) => r.arrayBuffer())
        .then((buf) => success && success({ data: buf }))
        .catch((e) => fail && fail(e))
    },
    getFileInfo({ filePath, success, fail }) {
      fetch(filePath, { method: 'HEAD' })
        .then((r) => ({
          size: parseInt(r.headers.get('Content-Length') || '0', 10)
        }))
        .then((info) => success && success(info))
        .catch((e) => fail && fail(e))
    }
  }
}

function getFileInfo({ filePath, success, fail }) {
  return getFileSystemManager().getFileInfo({ filePath, success, fail })
}

function saveImageToPhotosAlbum({ filePath, success, fail }) {
  // H5 中可下载图片
  try {
    const a = document.createElement('a')
    a.href = filePath
    a.download = filePath.split('/').pop() || 'image.png'
    a.target = '_blank'
    a.click()
    success && success()
  } catch (e) {
    fail && fail(e)
  }
}

// canvas 相关：保留 API 形状但用 hidden canvas
const _canvasPool = {}
function _getCanvas(canvasId, inst) {
  // 在 H5 中没有 canvasId 概念，创建一个离屏 canvas
  const c = document.createElement('canvas')
  c.id = canvasId
  return c
}

function canvasToTempFilePath({ canvasId, success, fail }) {
  const c = (typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId) || _canvasPool[canvasId]
  if (!c) return fail && fail({ errMsg: 'canvas not found' })
  try {
    const dataURL = c.toDataURL('image/png')
    success && success({ tempFilePath: dataURL })
  } catch (e) {
    fail && fail(e)
  }
}

// ========== 键盘 / 屏幕事件 ==========
const _onKeyboardListeners = new Set()
function onKeyboardHeightChange(cb) {
  // 视觉视口变化近似键盘高度
  const handler = () => {
    const visualHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight
    const keyboardHeight = window.innerHeight - visualHeight
    cb({ height: keyboardHeight > 0 ? keyboardHeight : 0 })
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handler)
  }
  window.addEventListener('resize', handler)
  _onKeyboardListeners.add({ handler, cb })
}
function offKeyboardHeightChange(cb) {
  for (const item of _onKeyboardListeners) {
    if (item.cb === cb || !cb) {
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', item.handler)
      window.removeEventListener('resize', item.handler)
      _onKeyboardListeners.delete(item)
    }
  }
}

function onAppRoute(cb) {
  // 监听路由变化
  import('./router-bridge').then(({ router }) => {
    router().afterEach((to) => {
      cb({
        page: {
          window: {
            navigationBarTitleText: to.meta?.title || ''
          }
        }
      })
    })
  })
}

// ========== SelectorQuery / createSelectorQuery ==========
// H5 中以 DOM 查询替代
function createSelectorQuery() {
  const _selectors = []
  const query = {
    select(selector) {
      _selectors.push({ type: 'select', selector })
      return {
        boundingClientRect(cb) {
          query._exec.push({ type: 'rect', selector, cb })
          return query
        },
        fields(fields, cb) {
          query._exec.push({ type: 'fields', selector, fields, cb })
          return query
        },
        scrollOffset(cb) {
          query._exec.push({ type: 'scroll', selector, cb })
          return query
        }
      }
    },
    selectAll(selector) {
      _selectors.push({ type: 'selectAll', selector })
      return {
        boundingClientRect(cb) {
          query._exec.push({ type: 'rectAll', selector, cb })
          return query
        }
      }
    },
    exec(cb) {
      const res = []
      for (const item of query._exec) {
        if (item.type === 'rect') {
          const el = document.querySelector(item.selector)
          if (el) {
            const r = el.getBoundingClientRect()
            res.push(r)
          } else {
            res.push(null)
          }
        } else if (item.type === 'rectAll') {
          const els = document.querySelectorAll(item.selector)
          res.push(Array.from(els).map((el) => el.getBoundingClientRect()))
        }
      }
      cb && cb(res)
      query._exec = []
      return query
    },
    _exec: [],
    in() {
      return query
    }
  }
  return query
}

// ========== 音频 ==========
function createInnerAudioContext(opts = {}) {
  let audio = null
  const ctx = {
    src: '',
    onPlay(cb) { ctx._onPlay = cb },
    onPause(cb) { ctx._onPause = cb },
    onStop(cb) { ctx._onStop = cb },
    onEnded(cb) { ctx._onEnded = cb },
    onError(cb) { ctx._onError = cb },
    onTimeUpdate(cb) { ctx._onTimeUpdate = cb },
    play() {
      if (!audio) {
        audio = new Audio(ctx.src)
        audio.addEventListener('play', () => ctx._onPlay && ctx._onPlay())
        audio.addEventListener('pause', () => ctx._onPause && ctx._onPause())
        audio.addEventListener('ended', () => ctx._onEnded && ctx._onEnded())
        audio.addEventListener('error', (e) => ctx._onError && ctx._onError(e))
        audio.addEventListener('timeupdate', () => ctx._onTimeUpdate && ctx._onTimeUpdate({ currentTime: audio.currentTime, duration: audio.duration }))
      }
      audio.play().catch((e) => ctx._onError && ctx._onError(e))
    },
    pause() { audio && audio.pause() },
    stop() { if (audio) { audio.pause(); audio.currentTime = 0 } ctx._onStop && ctx._onStop() },
    seek(t) { if (audio) audio.currentTime = t },
    destroy() { if (audio) { audio.pause(); audio.src = ''; audio = null } },
    set src(v) { ctx._src = v },
    get src() { return ctx._src },
    autoplay: false,
    loop: false,
    obeyMuteSwitch: true,
    volume: 1
  }
  // 支持两种写法：wx.createInnerAudioContext({ src }) 和 之后赋 ctx.src
  if (opts.src) ctx.src = opts.src
  Object.defineProperty(ctx, 'src', {
    get() { return ctx._src },
    set(v) {
      ctx._src = v
      if (audio) audio.src = v
    }
  })
  return ctx
}

// ========== setNavigationBarTitle ==========
function setNavigationBarTitle({ title, success, fail }) {
  try {
    document.title = title || document.title
    success && success()
  } catch (e) {
    fail && fail(e)
  }
}

// ========== nextTick ==========
function nextTick(cb) {
  return Promise.resolve().then(cb)
}

// ========== reportEvent（数据上报） ==========
function reportEvent(eventName, data) {
  console.log('[wx-adapter] reportEvent', eventName, data)
  // 真实场景接入埋点 SDK
}

// ========== 支付 ==========
function requestPayment({ timeStamp, nonceStr, package: pkg, signType, paySign, success, fail }) {
  // H5 中需要后端返回 H5 支付链接或微信内 JSAPI 支付参数
  console.warn('[wx-adapter] wx.requestPayment 需要后端配合接入微信 H5 支付 (JSAPI)')
  if (window.confirm('模拟支付成功？')) {
    success && success({ errMsg: 'requestPayment:ok' })
  } else {
    fail && fail({ errMsg: 'requestPayment:fail cancel' })
  }
}

// ========== exitMiniProgram ==========
function exitMiniProgram() {
  // H5 中无对应概念，关闭当前 tab
  window.close()
}

// ========== updateManager（无意义，stub） ==========
function getUpdateManager() {
  console.warn('[wx-adapter] H5 不需要 updateManager')
  return {
    onCheckForUpdate() {},
    onUpdateReady() {},
    onUpdateFailed() {},
    applyUpdate() {}
  }
}

// ========== 导出 ==========
export const wx = {
  // 路由
  navigateTo,
  redirectTo,
  switchTab,
  reLaunch,
  navigateBack,
  // 存储
  getStorageSync,
  setStorageSync,
  removeStorageSync,
  getStorage,
  setStorage,
  // UI
  showToast,
  showLoading,
  hideLoading,
  showModal,
  showActionSheet,
  // 系统信息
  getSystemInfoSync,
  getSystemInfo,
  getWindowInfo,
  getAccountInfoSync,
  canIUse,
  // 网络
  request,
  uploadFile,
  downloadFile,
  // 媒体
  chooseImage,
  chooseMedia,
  getImageInfo,
  previewImage,
  saveImageToPhotosAlbum,
  // 文件系统
  getFileSystemManager,
  getFileInfo,
  // Canvas
  canvasToTempFilePath,
  // 键盘 / 屏幕
  onKeyboardHeightChange,
  offKeyboardHeightChange,
  onAppRoute,
  // 选择器
  createSelectorQuery,
  // 音频
  createInnerAudioContext,
  // 系统
  setNavigationBarTitle,
  nextTick,
  // 用户
  login,
  getSetting,
  authorize,
  openSetting,
  getUserProfile,
  // 业务
  openCustomerServiceChat,
  reportEvent,
  requestPayment,
  exitMiniProgram,
  getUpdateManager,
  // 剪贴板 / 振动
  setClipboardData,
  getClipboardData,
  vibrateShort,
  vibrateLong
}

export default wx
