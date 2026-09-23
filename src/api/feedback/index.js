// 反馈服务（对应小程序 services/feedback/index.js）
import http from '@/api/http'

export function submitFeedback(data) {
  return http.post('/api/v1/user/user/submitFeedback', data)
}

export function getFeedbackTypes(param) {
  return http.get('/api/v1/user/user/getFeedbackTypes', param)
}
