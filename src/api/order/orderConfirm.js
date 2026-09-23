// 订单确认服务（对应小程序 services/order/orderConfirm.js）
import http from '@/api/http'

export function fetchSettleDetail(params) {
  return http.get('/api/v1/trade/order/settleDetail', params)
}

export function dispatchCommitPay(params) {
  return http.post('/api/v1/trade/order/commitPay', params)
}

export function dispatchSupplementInvoice() {
  return http.post('/api/v1/trade/order/supplementInvoice')
}
