// AI 对话服务（对应小程序 services/ai/chat.js）
import http from '@/api/http'

export function sendMessage(data, onChunk, isGroup = false) {
  const url = isGroup ? '/api/v1/server/groupChat/generateContent' : '/api/v1/server/plot/generateContent'
  return http.postStream(url, data, { enableChunked: true, onChunk })
}

export function createSession(data) {
  return http.post('/api/v1/server/chat/createChat', data)
}

export function createPlot(data) {
  const autoReply = localStorage.getItem('autoReply') === 'true'
  return http.post('/api/v1/server/plot/createPlot', { ...data, autoReply })
}

export function getSessionList(params) {
  return http.get('/api/v1/server/chat/getChatList', params)
}

export function getSessionDetail(sessionId) {
  return http.get(`/api/v1/server/chat/getChatMessage?chatId=${sessionId}`)
}

export function deleteSession(sessionId) {
  return http.delete(`/api/v1/ai/session/${sessionId}`)
}

export function getHomePlotMessage() {
  return http.get('/api/v1/server/plot/getDefaultPlotMessage')
}

export function getPlotMessage(params) {
  return http.get('/api/v1/server/plot/getPlotMessage', params)
}

export function getChatList(params) {
  return http.get('/api/v1/server/plot/getChatList', params)
}

export function deletePlot(data) {
  return http.post('/api/v1/server/plot/deletePlot', data)
}

export function deleteChat(data) {
  return http.post('/api/v1/server/plot/deleteChat', data)
}

export function topChat(data) {
  return http.post('/api/v1/server/plot/topChat', data)
}

export function getPlotDetail(plotId) {
  return http.get(`/api/v1/server/plot/getPlotDetail?plotId=${plotId}`)
}

export function updatePlot(data) {
  return http.post('/api/v1/server/plot/updatePlot', data)
}

export function setCurrentPlot(data) {
  return http.post('/api/v1/server/plot/setCurrentPlot', data)
}

export function forkPlotFromMessage(data) {
  return http.post('/api/v1/server/plot/forkPlotFromMessage', data)
}

export function rollbackPlotMessage(data) {
  return http.post('/api/v1/server/plot/rollbackPlotMessage', data)
}

export function saveUserMessage(data) {
  return http.post('/api/v1/server/plot/saveUserMessage', data)
}

export function inspirationReply(data) {
  return http.post('/api/v1/server/plot/inspirationReply', data)
}

export function retellMessage(data, onChunk) {
  return http.postStream('/api/v1/server/plot/retell', data, { enableChunked: true, onChunk })
}

export function setCurrentMessage(data) {
  return http.post('/api/v1/server/plot/setCurrentMessage', data)
}

export function getMemoryType() {
  return http.get('/api/v1/server/plot/getMemoryType')
}

export function createStory(data) {
  return http.post('/api/v1/server/story/createStory', data)
}

export function updateStory(data) {
  return http.post('/api/v1/server/story/updateStory', data)
}

export function getBlogList(params) {
  return http.get('/api/v1/ai/blog/list', params)
}

export function getStyleList() {
  return http.get('/api/v1/server/menu/getBaowenStyle')
}

export function getBloggerType() {
  return http.get('/api/v1/server/menu/getBloggerType')
}

export function getCommentCategory(params) {
  return http.get('/api/v1/server/menu/getCommentCategory', params)
}
