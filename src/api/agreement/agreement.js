// 协议服务（对应小程序 services/agreement/agreement.js）
import http from '@/api/http'

export function getAgreementContent(agreementType) {
  return http.get(`/api/v1/user/user/getAgreement?agreementType=${agreementType}`)
}
