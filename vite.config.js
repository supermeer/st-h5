import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import { VitePWA } from 'vite-plugin-pwa'
import pxToViewport from 'postcss-px-to-viewport-8-plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rpxToVw } from './src/utils/rpxToVw.js'
import postcssRpxToVw from './src/utils/postcss-rpx-to-vw.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // rpx → vw 转换插件（必须在 vue() 之前，确保在 SCSS 编译前处理）
    rpxToVw({ viewportWidth: 375 }),
    vue(),
    AutoImport({
      // Vant 函数式 API 自动按需引入（showToast/showDialog/showLoadingToast 等）
      resolvers: [VantResolver({ module: 'esm' })],
      // Vue 3 组合式 API 自动引入（ref/reactive/computed/onMounted 等）
      imports: ['vue', 'vue-router'],
      // 自动识别 src 目录下的工具函数
      dts: 'src/auto-imports.d.ts',
      // eslint 兼容
      eslintrc: { enabled: false }
    }),
    Components({
      // 自动按需注册 Vant 组件（module: 'esm' 兼容 ESM 项目）
      resolvers: [VantResolver({ module: 'esm' })],
      // 同时支持 src/components 下本地组件自动注册
      dirs: ['src/components'],
      // 排除非 .vue 文件防止误匹配
      extensions: ['vue'],
      // 生成类型声明文件
      dts: 'src/components.d.ts'
    }),
    // PWA：生成 manifest + Service Worker (Workbox)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: '星语酒馆',
        short_name: '星语酒馆',
        description: '智能角色扮演 AI 对话平台',
        theme_color: '#174DFF',
        background_color: '#15151c',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'zh-CN',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        // 预缓存静态资源 + 运行时缓存（同源 GET 请求）
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,ico,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /^https:\/\/.*\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 }
            }
          }
        ]
      },
      devOptions: {
        // 开发模式下也启用 Service Worker（方便调试）
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    postcss: {
      plugins: [
        // 先把 rpx 转换为 vw（处理 :root 等自定义属性）
        postcssRpxToVw({ viewportWidth: 375 }),
        // 把 px 转成 vw，模拟小程序的 rpx：375px(设计稿) → 100vw
        // 1px ≈ 0.2667vw，对应小程序 1rpx ≈ 0.133vw
        pxToViewport({
          viewportWidth: 375,
          unitPrecision: 5,
          viewportUnit: 'vw',
          fontViewportUnit: 'vw',
          selectorBlackList: ['.ignore-vw'],
          minPixelValue: 1
        })
      ]
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  }
})
