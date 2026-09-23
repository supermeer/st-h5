import request from '@/api/http'

// 获取音色列表
export function getVoiceList(params) {
  return request({
    url: '/api/tts/voice/list',
    method: 'GET',
    params
  })
}

// 获取音色类型
export function getVoiceTypes() {
  return request({
    url: '/api/tts/voice/types',
    method: 'GET'
  })
}

// 获取音色标签
export function getVoiceTags() {
  return request({
    url: '/api/tts/voice/tags',
    method: 'GET'
  })
}

// 设置角色音色
export function setCharacterVoice(data) {
  return request({
    url: '/api/tts/character/voice/set',
    method: 'POST',
    data
  })
}

// 更新角色音色
export function updateCharacterVoice(data) {
  return request({
    url: '/api/tts/character/voice/update',
    method: 'POST',
    data
  })
}

// 添加收藏音色
export function addFavoriteVoice(data) {
  return request({
    url: '/api/tts/voice/favorite/add',
    method: 'POST',
    data
  })
}

// 移除收藏音色
export function removeFavoriteVoice(data) {
  return request({
    url: '/api/tts/voice/favorite/remove',
    method: 'POST',
    data
  })
}

// 重置角色音色
export function resetCharacterVoice(data) {
  return request({
    url: '/api/tts/character/voice/reset',
    method: 'POST',
    data
  })
}
