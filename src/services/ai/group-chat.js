import http from '@/api/http'

// 创建群聊
export function createGroupChat(data) {
  return http.post('/api/v1/server/groupChat/createGroupChat', data)
}

// 更新群聊
export function updateGroupChat(data) {
  return http.post('/api/v1/server/groupChat/updateGroupChat', data)
}

// 获取群聊故事列表
export function getStoryList(params) {
  return http.get('/api/v1/server/groupChat/getStoryList', params)
}

// 获取群聊剧情列表
export function getPlotListByGroupChatId(params) {
  return http.get('/api/v1/server/groupChat/getPlotListByGroupChatId', params)
}

// 设置当前剧情
export function setCurrentPlot(data) {
  return http.post('/api/v1/server/groupChat/setCurrentPlot', data)
}
