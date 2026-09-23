// 角色服务（对应小程序 services/role/index.js）
import http from '@/api/http'

export function getCharacterType() {
  return http.get('/api/v1/server/character/getCharacterType')
}

export function getCharacterTag() {
  return http.get('/api/v1/server/character/getCharacterTag')
}

export function createCharacter(data) {
  return http.post('/api/v1/server/character/createCharacter', data)
}

export function updateCharacter(data) {
  return http.post('/api/v1/server/character/updateCharacter', data)
}

export function deleteCharacter(data) {
  return http.post('/api/v1/server/character/deleteCharacter', data)
}

export function applyCharacterPublished(data) {
  return http.post('/api/v1/server/character/applyCharacterPublished', data)
}

export function unpublishChar(data) {
  return http.post('/api/v1/server/character/unpublishCharacter', data)
}

export function getAuditRejectReason(params) {
  return http.get('/api/v1/server/character/getAuditRejectReason', params)
}

export function createPersona(data) {
  return http.post('/api/v1/server/story/createPersona', data)
}

export function updatePersona(data) {
  return http.post('/api/v1/server/story/updatePersona', data)
}

export function deleteDefaultPersona() {
  return http.post('/api/v1/server/story/deleteDefaultPersona')
}

export function getCharacterRanking(params) {
  return http.get('/api/v1/server/character/getCharacterRanking', params)
}

export function shareCharacter(data) {
  return http.post('/api/v1/server/character/shareCharacter', data)
}

export function getCharacterList(params) {
  return http.get('/api/v1/server/character/getCharacterList', params)
}

export function enterFromDiscover(data) {
  return http.post('/api/v1/server/character/enterFromDiscover', data)
}

export function createChatStyle(data) {
  return http.post('/api/v1/server/story/createChatStyle', data)
}

export function getChatStyleList(params) {
  return http.get('/api/v1/server/story/getChatStyleList', params)
}

export function getPlotListByCharacterId(params) {
  return http.get('/api/v1/server/plot/getPlotListByCharacterId', params)
}

export function getCharacterDetail(characterId, ifReplace = 1) {
  return http.get(`/api/v1/server/character/getCharacterDetail?characterId=${characterId}&ifReplace=${ifReplace}`)
}

export function getCharacterDetailByParams(params) {
  return http.get('/api/v1/server/character/getCharacterDetail', { ...params, ifReplace: params.ifReplace || 1 })
}

export function restorePlotChatStyle(data) {
  return http.post('/api/v1/server/plot/restorePlotChatStyle', data)
}

export function getStoryDetail(storyId) {
  return http.get(`/api/v1/server/story/getStoryDetail?storyId=${storyId}`)
}

export function getPlotDetail(plotId) {
  return http.get(`/api/v1/server/plot/getPlotDetail?plotId=${plotId}`)
}

export function getCurrentPlotByCharacterId(characterId) {
  return http.get(`/api/v1/server/plot/getCurrentPlotByCharacterId?characterId=${characterId}`)
}

export function getPersonaDetail(id) {
  return http.get(`/api/v1/server/story/getPersonaDetail?personaId=${id}`)
}

export function getHotSearchKeywords() {
  return http.get('/api/v1/server/character/getHotSearchKeywords')
}

export function getDefaultPersona() {
  return http.get('/api/v1/server/story/getDefaultPersona')
}

export function updateDefaultPersona(data) {
  return http.post('/api/v1/server/story/updateDefaultPersona', data)
}

export function generateDescription(data) {
  return http.post('/api/v1/server/character/generateDescription', data)
}
