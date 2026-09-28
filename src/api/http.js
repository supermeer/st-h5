import axios from 'axios'
import { showToast } from 'vant'
import { config, mockHandlers } from './config'

// 创建一个 axios 实例
const http = axios.create({
  baseURL: config.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ============ 请求拦截器：注入 Token ============
http.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem('token') || ''
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`
    }
    return cfg
  },
  (err) => Promise.reject(err)
)

// ============ Mock 适配器：当 useMock=true 时，跳过真实请求返回本地数据 ============
if (config.useMock) {
  http.defaults.adapter = (cfg) => {
    // 在 mock 模式下，cfg.url 通常已经是相对路径（去掉 baseURL 后）
    let path = cfg.url || ''
    // 兜底：如果还包含 baseURL，截掉
    if (cfg.baseURL && path.startsWith(cfg.baseURL)) {
      path = path.slice(cfg.baseURL.length)
    }
    // 去掉 query string 后再匹配（mockHandlers 的 key 不含 ? 后内容）
    const purePath = path.split('?')[0]
    const handler = mockHandlers[purePath] || mockHandlers.default

    return new Promise((resolve) => {
      const data = handler ? handler(cfg) : null
      // 模拟网络延迟
      setTimeout(() => {
        resolve({
          data: { code: 200, data, success: true, msg: 'OK', traceId: null },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: cfg,
          request: {}
        })
      }, 200)
    })
  }
  // eslint-disable-next-line no-console
  console.info('[H5 Mock] 已启用本地 Mock 模式，所有 API 请求返回本地测试数据')
}

// ============ 响应拦截器：统一处理业务码 ============
http.interceptors.response.use(
  (res) => {
    const data = res.data
    // SSE 流式响应不会经过这里（走 fetch 分支）
    if (data && data.code === 200) {
      return data.data
    }
    // 兼容部分接口直接返回数据
    if (data && typeof data === 'object' && !('code' in data)) {
      return data
    }
    const { code, msg } = data || {}
    if (code === 10006 || code === 10007 || code === 10009) {
      const aE = localStorage.getItem('aE')
      if (aE === '0') {
        const tip = code === 10009 ? '抱歉，您暂时无法使用该功能' : '能量不足，明天再来吧！'
        showToast(tip)
        return Promise.reject({ code, msg: tip })
      }
      // 非 0 环境：弹出升级 VIP 提示
      showToast({ content: msg || '积分不足，请购买积分套餐或加油包', message: msg })
      // 这里可以接入业务方 tip-dialog；默认 toast
      return Promise.reject({ code: 402, msg: '积分不足，请购买积分套餐或加油包' })
    }
    showToast(msg || '请求发生错误')
    return Promise.reject(data)
  },
  (err) => {
    const status = err?.response?.status
    const msg = err?.response?.data?.msg || err?.message || '请求发生错误'
    if (status === 401) {
      // 清理登录态
      localStorage.removeItem('token')
      localStorage.removeItem('openId')
      localStorage.removeItem('user')
      localStorage.removeItem('vipInfo')
      // 跳转到首页或触发登录弹窗（业务方可监听）
      window.dispatchEvent(new CustomEvent('h5:auth-required'))
    } else if (status === 402) {
      return Promise.reject({ code: 402, msg: '积分不足，请购买积分套餐或加油包' })
    }
    showToast(msg)
    return Promise.reject(err.response?.data || err)
  }
)

// ============ SSE 流式解析器（对应原 httprequest.js 中的 StreamParser）============
class StreamParser {
  constructor() {
    this.buffer = ''
  }
  reset() {
    this.buffer = ''
  }
  // 输入任意字符串增量，返回解析出的完整 SSE 消息数组（不含心跳）
  parseChunk(chunk) {
    if (!chunk) return []
    this.buffer += chunk
    const messages = []
    // SSE 消息以 \n\n 分隔
    let idx
    while ((idx = this.buffer.indexOf('\n\n')) !== -1) {
      const raw = this.buffer.slice(0, idx)
      this.buffer = this.buffer.slice(idx + 2)
      if (raw.trim()) messages.push(raw)
    }
    return messages
  }
}

const streamParser = new StreamParser()

// ============ 主入口：request(options) ============
// options: { url, method, data, headers, enableChunked, onChunk, _raw, ... }
//   - _raw: 透传 axios 完整响应（用于 wx-adapter 等需要 statusCode/header 的场景）
//   - enableChunked: 流式请求（返回 fetch promise + onChunk）
export async function request(options) {
  const { url, method = 'GET', data, headers, enableChunked, onChunk, _raw = false } = options

  if (enableChunked) {
    return postStream(url, data, { ...options, onChunk })
  }

  // GET 请求：将 data 转换为 query params（与小程序 httprequest 行为一致）
  // 其他方法：data 作为请求体
  const isGet = String(method).toUpperCase() === 'GET'
  const cfg = {
    url,
    method,
    data: isGet ? undefined : data,
    params: isGet ? data : undefined,
    headers,
    _raw
  }
  try {
    const res = await http.request(cfg)
    if (_raw) return res
    return res
  } catch (err) {
    throw err
  }
}

async function get(url, data, options = {}) {
  return request({ url, method: 'GET', data, ...options })
}
async function post(url, data, options = {}) {
  return request({ url, method: 'POST', data, ...options })
}
async function put(url, data, options = {}) {
  return request({ url, method: 'PUT', data, ...options })
}
async function del(url, data, options = {}) {
  return request({ url, method: 'DELETE', data, ...options })
}

// ============ 流式 POST（text/event-stream）============
// 通过 fetch + ReadableStream，按 SSE 协议解析（data: {...}\n\n）
// 与原 httprequest.js 中 onChunkReceived 解析逻辑保持一致
export function postStream(url, data, options = {}) {
  const { onChunk, header = {}, _raw } = options
  const fullUrl = url.startsWith('http') ? url : (config.baseUrl + url)
  const token = localStorage.getItem('token') || ''
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...header
  }

  streamParser.reset()

  // 返回一个可控的 controller-like 对象：包含 abort 方法
  const controller = {
    abort: () => {
      if (controller._aborter) controller._aborter.abort()
    },
    onChunk
  }

  const aborter = new AbortController()
  controller._aborter = aborter

  // 用 AbortController 发起流式请求
  const realFetch = fetch(fullUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    signal: aborter.signal
  })

  realFetch
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        const err = { statusCode: res.status, message: text || 'stream request failed', data: text }
        onChunk && onChunk({ eventType: 'error', error: err })
        throw err
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      // 兼容 _raw 场景：返回完整 response
      if (_raw) {
        // 仍然走流式解析
      }
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const messages = streamParser.parseChunk(chunk)
        for (const rawMessage of messages) {
          if (!rawMessage.trim()) continue
          const eventType =
            rawMessage
              .split('\n')
              .find((line) => line.startsWith('event:'))
              ?.slice(6)
              .trim() || 'message'
          if (eventType === 'ping') continue

          const dataContent = rawMessage
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('\n')

          if (dataContent === '[DONE]') {
            onChunk && onChunk({ eventType: 'done', payload: { done: true } })
            continue
          }

          if (dataContent) {
            try {
              const payload = JSON.parse(dataContent)
              if (payload.choices && Array.isArray(payload.choices)) {
                const delta = payload.choices[0]?.delta || {}
                const content = delta.content || ''
                const finishReason = payload.choices[0]?.finish_reason
                onChunk && onChunk({
                  eventType,
                  payload,
                  content,
                  finishReason,
                  isOpenAI: true
                })
              } else {
                onChunk && onChunk({ eventType, payload })
              }
            } catch (e) {
              console.error('SSE 消息解析失败', e, dataContent)
              onChunk && onChunk({ eventType: 'error', error: e, rawData: dataContent })
            }
          }
        }
      }
      streamParser.reset()
    })
    .catch((err) => {
      streamParser.reset()
      if (err?.name === 'AbortError') return
      // 已经通过 onChunk 通知过 error
      console.error('stream fetch error', err)
    })

  return controller
}

export default {
  request,
  get,
  post,
  put,
  delete: del,
  postStream
}
