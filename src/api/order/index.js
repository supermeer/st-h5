// 订单服务（对应小程序 services/order/index.js）
import http from '@/api/http'

export function getPackages() {
  return http.get('/api/v1/trade/order/getPricingPlan')
}

export function createOrderAndPrepay(data) {
  return http.post('/api/v1/trade/order/createOrderAndPrepay', data)
}

export function getPricingPlan(params) {
  return http.get('/api/v1/trade/order/getPricingPlan', params)
}

export function getOrderList() {
  return http.get('/api/v1/trade/order/getOrderList')
}

export function queryOrderStatus(orderId) {
  return http.get(`/api/v1/trade/order/status/${orderId}`)
}
