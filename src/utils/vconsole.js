// VConsole 调试工具（仅在开发模式或显式开启时加载）
// 加载方式：
//   1. import.meta.env.DEV = true（开发模式自动启用）
//   2. localStorage.setItem('vconsole', '1') 后刷新
//   3. URL 参数 ?vconsole=1
import VConsole from 'vconsole'

let instance = null

function shouldEnable() {
  if (typeof window === 'undefined') return false
  if (import.meta.env?.DEV) return true
  try {
    if (localStorage.getItem('vconsole') === '1') return true
  } catch (e) {}
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('vconsole') === '1') return true
  } catch (e) {}
  return false
}

export function setupVConsole() {
  if (instance) return instance
  if (!shouldEnable()) return null
  try {
    instance = new VConsole({
      theme: 'dark'
    })
    console.log('[vconsole] enabled')
  } catch (e) {
    console.warn('[vconsole] init failed', e)
  }
  return instance
}

export function destroyVConsole() {
  if (instance) {
    instance.destroy()
    instance = null
  }
}
