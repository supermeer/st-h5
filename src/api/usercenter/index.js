// 用户中心服务（对应小程序 services/usercenter/index.js）
import http from '@/api/http'

export function login(data) {
  return http.post('/api/v1/auth/wx/login', data)
}

export function bindPhoneNumber(data) {
  return http.post('/api/v1/user/user/bindingPhone', data)
}

export function getMyVipInfo() {
  return http.get('/api/v1/user/vip/getMyVipInfo')
}

export function redeemInviteCode(data) {
  return http.post(`/api/v1/user/user/useInvitationCode?invitationCode=${data.invitationCode}`, data)
}

export function getQuotaInfo() {
  return http.get('/api/v1/user/vip/getQuotaInfo')
}

export function getAgreement(agreementType) {
  return http.get(`/api/v1/user/user/getAgreement?agreementType=${agreementType}`)
}

export function logoff() {
  return http.post('/api/v1/user/user/cancelAccount')
}

export function generateInvitationCode() {
  return http.get('/api/v1/user/user/generateInvitationCode')
}

export function getShareRecord() {
  return http.get('/api/v1/user/user/invitedUserList')
}

export function getActivity(params) {
  return http.get('/api/v1/user/user/getActivity', params)
}

export function visitPages(data) {
  return http.post('/api/v1/user/user/visitPages', data)
}

export function getModelList() {
  return http.get('/api/v1/server/model/getModelList')
}

export function getGlobalModelId() {
  return http.get('/api/v1/server/model/getGlobalModelId')
}

export function setGlobalModel(data) {
  return http.post('/api/v1/server/model/setGlobalModel', data)
}

export function getIfSpringFestival() {
  return http.get('/api/v1/server/model/getGlobalModelId')
}

export function isSpringFestivalExpired() {
  return http.get('/api/v1/user/user/isSpringFestivalExpired')
}

export function checkPhoneStatus() {
  return http.get('/api/user/phone/status')
}

export function updateUserInfo(data) {
  return http.post('/api/v1/user/user/updateUserInfo', data)
}

export function getMyIncomeOverview() {
  return http.get('/api/v1/user/creator/getMyIncomeOverview')
}

export function getMyAchievements(params) {
  return http.get('/api/v1/user/creator/getMyAchievements', params)
}

export function getMyIncomeDetails(params) {
  return http.get('/api/v1/user/creator/getMyIncomeDetails', params)
}

export function getStarShowcase(params) {
  return http.get('/api/v1/user/user/getStarShowcase', params)
}

export function getMinorReminderConfig() {
  return http.get('/api/v1/user/user/getMinorReminderConfig')
}

export function confirmAdultIdentity(data) {
  return http.post('/api/v1/user/user/confirmAdultIdentity', data)
}

// 微信 JSSDK 签名（用于 H5 在微信内调用 wx.config）
export function getJsSdkSignature(data) {
  return http.get('/api/v1/wechat/jssdk/config', data)
}
