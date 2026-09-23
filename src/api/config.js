// config/index.js —— 后端地址配置（对应小程序 config/index.js）
// H5 通过 import.meta.env 区分环境

const devBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:19000'
const prodBase = import.meta.env.VITE_API_BASE_URL || 'https://www.yours-x.com/character'

const isDev = import.meta.env.DEV
const baseUrl = isDev ? devBase : prodBase

export const config = {
  useMock: false,
  baseUrl
}

export const cdnBase =
  'https://we-retail-static-1300977798.cos.ap-guangzhou.myqcloud.com/retail-mp'
