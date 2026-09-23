// 微信 JS-SDK 适配层
// 仅当检测到浏览器 UA 包含 MicroMessenger 时才会真正加载 jweixin
// 用法：
//   import { setupWechat, shareToWechat } from '@/utils/wechat-jssdk'
//   await setupWechat()    // 注入 wx.config
//   shareToWechat({ title, desc, link, imgUrl })
import { getJsSdkSignature } from '@/api/usercenter'
import { wx as wxAdapter } from './wx-adapter'

let configured = false
let pendingConfig = null
let loadPromise = null

export function isWechatBrowser() {
  if (typeof navigator === 'undefined') return false
  return /micromessenger/i.test(navigator.userAgent)
}

function loadJweixin() {
  if (loadPromise) return loadPromise
  loadPromise = import('weixin-js-sdk').then((mod) => mod.default || mod)
  return loadPromise
}

function getCurrentUrl() {
  if (typeof window === 'undefined') return ''
  return window.location.href.split('#')[0]
}

export async function setupWechat(jsApiList = [
  'updateAppMessageShareData',
  'updateTimelineShareData',
  'onMenuShareTimeline',
  'onMenuShareAppMessage',
  'chooseWXPay',
  'scanQRCode',
  'getLocation'
]) {
  if (!isWechatBrowser()) return null
  if (configured) return pendingConfig
  try {
    const wx = await loadJweixin()
    const signatureResp = await getJsSdkSignature({ url: getCurrentUrl() })
    const data = signatureResp?.data || signatureResp || {}
    const config = {
      debug: import.meta.env.DEV,
      appId: data.appId,
      timestamp: data.timestamp || String(Math.floor(Date.now() / 1000)),
      nonceStr: data.nonceStr,
      signature: data.signature,
      jsApiList
    }
    wx.config(config)
    pendingConfig = wx
    wx.ready(() => {
      configured = true
    })
    wx.error((err) => {
      console.warn('[jssdk] config error', err)
    })
    return wx
  } catch (e) {
    console.warn('[jssdk] setup failed', e)
    return null
  }
}

export function shareToWechat({ title, desc, link, imgUrl, type = 'link' } = {}) {
  if (!isWechatBrowser()) {
    // 非微信环境退化为系统分享 / 复制
    if (navigator.share) {
      navigator.share({ title, text: desc, url: link }).catch(() => {})
    } else if (link) {
      wxAdapter.setClipboardData({ data: link })
    }
    return Promise.resolve()
  }
  return setupWechat().then((wx) => {
    if (!wx) return
    wx.updateAppMessageShareData({
      title,
      desc,
      link,
      imgUrl,
      success() {},
      cancel() {}
    })
    wx.updateTimelineShareData({
      title,
      link,
      imgUrl,
      success() {},
      cancel() {}
    })
  })
}

export function wxPay(params) {
  if (!isWechatBrowser()) {
    return Promise.reject(new Error('当前不在微信环境'))
  }
  return setupWechat(['chooseWXPay']).then(
    (wx) =>
      new Promise((resolve, reject) => {
        if (!wx) return reject(new Error('JSSDK 未就绪'))
        wx.chooseWXPay({
          timestamp: params.timeStamp || params.timestamp,
          nonceStr: params.nonceStr,
          package: params.package,
          signType: params.signType || 'MD5',
          paySign: params.paySign,
          success: resolve,
          fail: reject
        })
      })
  )
}

export function scanQRCode() {
  if (!isWechatBrowser()) {
    return Promise.reject(new Error('当前不在微信环境'))
  }
  return setupWechat(['scanQRCode']).then(
    (wx) =>
      new Promise((resolve, reject) => {
        if (!wx) return reject(new Error('JSSDK 未就绪'))
        wx.scanQRCode({
          needResult: 1,
          scanType: ['qrCode', 'barCode'],
          success: (res) => resolve(res.resultStr),
          fail: reject
        })
      })
  )
}
