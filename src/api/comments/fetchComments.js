// 评论服务（对应小程序 services/comments/fetchComments.js）
import http from '@/api/http'

export function fetchComments(params) {
  return http.get('/api/v1/server/comments/fetchComments', params)
}
