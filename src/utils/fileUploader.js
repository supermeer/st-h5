// 文件上传工具（对应小程序 utils/fileUploader.js）
// 通过后端获取预签名 URL 后直接 PUT 上传到对象存储
import { fetchFilePresignedUrl, uploadConfirm } from '@/api/file'

/**
 * 推断文件内容类型
 * @param {string} name 文件名 / 路径
 */
function inferContentType(name) {
  const s = String(name || '').toLowerCase()
  if (s.endsWith('.png')) return 'image/png'
  if (s.endsWith('.jpg') || s.endsWith('.jpeg')) return 'image/jpeg'
  if (s.endsWith('.gif')) return 'image/gif'
  if (s.endsWith('.webp')) return 'image/webp'
  if (s.endsWith('.heic') || s.endsWith('.heif')) return 'image/heic'
  return 'application/octet-stream'
}

/**
 * 获取文件扩展名
 */
function inferExt(name) {
  const s = String(name || '').toLowerCase()
  const m = s.match(/\.([a-z0-9]+)(\?|$)/)
  return m ? m[1] : 'jpg'
}

/**
 * 把各种来源的 filePath 归一化为 Blob（用于 fetch PUT）
 * - File / Blob：直接使用
 * - objectURL（createObjectURL）：fetch 后转 Blob
 * - 普通 http(s) url：fetch 后转 Blob
 */
async function toBlob(filePath) {
  if (filePath instanceof Blob) return filePath
  if (typeof File !== 'undefined' && filePath instanceof File) return filePath
  const res = await fetch(filePath)
  if (!res.ok) throw new Error('read file failed')
  return await res.blob()
}

/**
 * 从 Blob/File 推断文件名
 */
function genFileName(blob, hint) {
  const ts = Date.now()
  const ext = blob && blob.type ? (blob.type.split('/')[1] || 'jpg') : 'jpg'
  const prefix = hint ? String(hint).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20) : 'img'
  return `${prefix}_${ts}.${ext}`
}

/**
 * 上传文件
 * @param {object} options
 * @param {string|File|Blob} options.filePath  本地路径 / 远端 URL / File / Blob
 * @param {boolean} [options.ifPublic] 是否公共可访问
 * @param {(status)=>void} [options.onStatusChange] 状态回调 loading/success/fail
 * @param {(p:number)=>void} [options.onProgress] 进度回调（XMLHttpRequest 支持）
 * @returns {Promise<{localPath:string,fileKey:string,remoteUrl:string,fileName:string}>}
 */
export function uploadFile({ filePath, onStatusChange, onProgress, ifPublic = false }) {
  return new Promise(async (resolve, reject) => {
    try {
      onStatusChange && onStatusChange('loading')
      const blob = await toBlob(filePath)
      const fileName = blob && blob.name ? blob.name : genFileName(blob, 'upload')
      const contentType = blob.type || inferContentType(fileName)
      const fileType = contentType.startsWith('video') ? 'video' : 'image'

      const signatureResp = await fetchFilePresignedUrl([
        {
          fileName,
          contentType,
          fileType,
          ifPublic
        }
      ])

      const signatureList = Array.isArray(signatureResp)
        ? signatureResp
        : Array.isArray(signatureResp?.data)
        ? signatureResp.data
        : []

      if (!signatureList.length) {
        onStatusChange && onStatusChange('fail')
        return reject(new Error('获取上传地址失败'))
      }

      const signature = signatureList[0]

      // 使用 XMLHttpRequest 以便支持进度回调
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', signature.uploadUrl, true)
      xhr.setRequestHeader('Content-Type', contentType)
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const remoteUrl = signature.uploadUrl.split('?')[0]
            // 通知后端确认上传
            let confirmed = null
            try {
              confirmed = await uploadConfirm({ fileKey: signature.fileKey })
            } catch (e) {
              // 确认失败也允许继续（H5 中多数后端允许忽略）
              console.warn('uploadConfirm failed', e)
            }
            onStatusChange && onStatusChange('success')
            resolve({
              localPath: URL.createObjectURL(blob),
              fileKey: signature.fileKey,
              remoteUrl,
              fileName
            })
          } catch (err) {
            onStatusChange && onStatusChange('fail')
            reject(err)
          }
        } else {
          onStatusChange && onStatusChange('fail')
          reject(new Error('上传失败：' + xhr.status))
        }
      }
      xhr.onerror = () => {
        onStatusChange && onStatusChange('fail')
        reject(new Error('上传失败'))
      }
      xhr.send(blob)
    } catch (err) {
      onStatusChange && onStatusChange('fail')
      reject(err)
    }
  })
}

export default uploadFile
