// rpxToVw.js —— Vite 插件：将 SCSS/CSS 中的 rpx 单位转换为 vw
// 小程序设计稿基准 375px，1rpx = 100/375 vw ≈ 0.2667vw

/**
 * @param {import('vite').UserConfig} options
 */
export function rpxToVw(options = {}) {
  const viewportWidth = options.viewportWidth || 375
  const precision = 5 // 小数位精度
  const factor = (100 / viewportWidth).toFixed(precision)

  // 匹配所有 rpx 数值（含 calc() 和 CSS 自定义属性）
  const reRpx = new RegExp(`(\\d+(?:\\.\\d+)?)rpx`, 'g')

  return {
    name: 'rpx-to-vw',
    enforce: 'pre', // 在其他插件之前处理
    transform(code, id) {
      // 只处理样式相关文件
      if (!/\.(css|scss|sass|vue|wxss)$/i.test(id)) return null
      // 跳过 node_modules
      if (/node_modules/.test(id)) return null
      // 快速跳过（无 rpx）
      if (!reRpx.test(code)) return null

      const transformed = code.replace(reRpx, (_match, value) => {
        const num = parseFloat(value)
        if (isNaN(num)) return _match
        const vw = (num * factor).toFixed(precision)
        const vwStr = vw.endsWith('.0') ? vw.replace('.0', '') : vw
        return `${vwStr}vw`
      })

      return { code: transformed, map: null }
    }
  }
}
