// 群聊服务（对应小程序 services/group/index.js）
import http from '@/api/http'

export function getGroupList(params) {
  return http.get('/api/v1/server/group/getGroupList', params)
}

export function getGroupDetail(groupId, plotId) {
  return http.get(`/api/v1/server/groupChat/getGroupChatDetail?groupChatId=${groupId}&plotId=${plotId}`)
}

export function getGroupDetailByParams(params) {
  return http.get('/api/v1/server/groupChat/getGroupChatDetail', params)
}

export function getGroupChatList(params) {
  return http.get('/api/v1/server/group/getGroupChatList', params)
}

export function applyPublish(data) {
  return http.post('/api/v1/server/groupChat/applyPublish', data)
}

export function getAuditRejectReason(params) {
  return http.get('/api/v1/server/groupChat/getAuditRejectReason', params)
}

export function unpublishGroup(data) {
  return http.post('/api/v1/server/groupChat/unpublish', data)
}

export function deleteGroup(data) {
  return http.post('/api/v1/server/groupChat/deleteGroupChat', data)
}

export function getUserGroupChatList(params) {
  return http.get('/api/v1/server/groupChat/getGroupChatList', params)
}

export function getCurrentPlotByGroupChatId(groupChatId) {
  return http.get(`/api/v1/server/plot/getCurrentPlotByGroupChatId?groupChatId=${groupChatId}`)
}

export function followUser(targetUserId) {
  return http.post('/api/v1/user/follow/follow', { targetUserId })
}

export function unfollowUser(targetUserId) {
  return http.post('/api/v1/user/follow/unfollow', { targetUserId })
}

export function shareGroup(data) {
  // stub
}
