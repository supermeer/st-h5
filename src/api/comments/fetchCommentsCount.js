// 评论数服务（对应小程序 services/comments/fetchCommentsCount.js）
import http from '@/api/http'

export function fetchCommentsCount(params) {
  return http.get('/api/v1/server/comments/fetchCommentsCount', params)
}
