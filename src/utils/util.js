// util.js —— 通用工具函数（对应小程序 utils/util.js）
// 移植了原项目的工具函数

import { marked } from 'marked'

// 格式化日期
export function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  const map = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds())
  }
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (k) => map[k])
}

export function formatDate(date) {
  return formatTime(date, 'YYYY-MM-DD')
}

// 节流
export function throttle(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) return
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

// 防抖
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 深拷贝
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map((it) => deepClone(it))
  const clone = {}
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      clone[k] = deepClone(obj[k])
    }
  }
  return clone
}

// 获取屏幕宽度（对应小程序 wx.getSystemInfoSync().windowWidth）
export function getScreenWidth() {
  return window.innerWidth
}

// 复制到剪贴板
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    return true
  } catch (e) {
    return false
  }
}

// 通用列表请求（分页）
export async function fetchList({ api, params = {}, pageKey = 'page', pageSizeKey = 'pageSize', dataKey = 'list' }) {
  const page = params[pageKey] || 1
  const pageSize = params[pageSizeKey] || 20
  const result = await api({ ...params, [pageKey]: page, [pageSizeKey]: pageSize })
  return {
    list: (dataKey ? result[dataKey] : result) || [],
    total: result.total || 0,
    page,
    pageSize
  }
}

// 从 marked 中按需导出
export { marked }
