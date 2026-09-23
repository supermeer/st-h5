// router-bridge.js
// 用于让 wx-adapter 等无 router 上下文的环境可以延迟获取 router 实例
// 这样 wx-adapter 不必在模块初始化时就 import router

import { router } from '@/router'

export function getRouter() {
  return router
}
