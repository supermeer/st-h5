// agreement.js —— 协议跳转（对应小程序 utils/agreement.js）
// H5 中跳转到协议页面

import router from '@/router'

export function openAgreement(type) {
  router.push({ path: `/pages/common/agreement/index`, query: { type } })
}
