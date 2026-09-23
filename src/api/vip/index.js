// VIP 服务（对应小程序 services/vip/index.js）
import http from '@/api/http'

export function getMyPointInfo() {
  return http.get('/api/v1/user/vip/getMyPointInfo')
}

export function getMyPointDetails(params) {
  return http.get('/api/v1/user/vip/getMyPointDetails', params)
}

export function getCharacterPointDetail(params) {
  return http.get('/api/v1/user/vip/getCharacterPointDetail', params)
}
