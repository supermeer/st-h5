// 文件上传服务（对应小程序 services/file/index.js）
import http from '@/api/http'

export function fetchFilePresignedUrl(data) {
  return http.post('/api/v1/server/file/uploadFileByPresigned', data)
}

export function fecthPublicFilePresignedUrl(data) {
  return http.post('/api/v1/server/backStage/uploadStaticFile', data)
}

export function verifyUrls(data) {
  return http.post('/api/v1/server/file/verifyUrls', data)
}

export function uploadConfirm(data) {
  return http.post('/api/v1/server/file/confirmUpload', data)
}

// 封装的上传图片函数
export async function uploadImage(file) {
  // 1. 获取预签名URL
  const presignedRes = await fetchFilePresignedUrl({
    fileName: file.name,
    fileType: file.type || 'image/jpeg'
  })
  
  // 2. 上传到预签名URL
  await fetch(presignedRes.url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'image/jpeg'
    }
  })
  
  // 3. 确认上传
  const confirmRes = await uploadConfirm({
    fileKey: presignedRes.fileKey
  })
  
  return confirmRes
}
