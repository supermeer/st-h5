// 首页服务（对应小程序 services/home/home.js）
import http from '@/api/http'

export function getHomePlotMessage() {
  return http.get('/api/v1/server/plot/getDefaultPlotMessage')
}

export function getBannerList() {
  return http.get('/api/v1/server/banner/list')
}

export function getCategoryList(params) {
  return http.get('/api/v1/server/menu/getCategories', params)
}

export function getShareMenus() {
  return http.get('/api/v1/server/menu/getShareMenus')
}

export function getBloggerTypeHistory() {
  return http.get('/api/v1/server/menu/getBloggerTypeHistory')
}
