// postcss-rpx-to-vw.js —— 将 CSS 中的 rpx 单位转换为 vw
// 用于处理 :root 自定义属性中的 rpx（Vite 的 transform 钩子处理不到 SCSS 编译后的 :root 内部）

/**
 * @param {Object} options
 * @param {number} options.viewportWidth - 设计稿基准宽度（默认 750，小程序默认 750）
 */
export default function postcssRpxToVw(options = {}) {
  const viewportWidth = options.viewportWidth || 375
  const precision = 5
  const factor = (100 / viewportWidth).toFixed(precision)
  const reRpx = /(\d+(?:\.\d+)?)rpx/g

  return {
    postcssPlugin: 'postcss-rpx-to-vw',
    Once(root) {
      root.walkDecls((decl) => {
        if (/\d+rpx/.test(decl.value)) {
          decl.value = decl.value.replace(reRpx, (_match, value) => {
            const num = parseFloat(value)
            if (isNaN(num)) return _match
            const vw = (num * factor).toFixed(precision)
            const vwStr = vw.endsWith('.0') ? vw.replace('.0', '') : vw
            return `${vwStr}vw`
          })
        }
      })
    }
  }
}

postcssRpxToVw.postcss = true
