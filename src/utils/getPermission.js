// getPermission.js —— 权限获取（对应小程序 utils/getPermission.js）
// H5 中直接 resolve（无权限控制），返回 Promise

export function getPermission({ code, name }) {
  return new Promise((resolve) => {
    console.warn(`[getPermission] H5 权限检查（code=${code}, name=${name}）默认通过`)
    resolve()
  })
}
