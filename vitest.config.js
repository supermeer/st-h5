/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [VantResolver({ module: 'esm' })],
      imports: ['vue', 'vue-router'],
      dts: false,
      eslintrc: { enabled: false }
    }),
    Components({
      resolvers: [VantResolver({ module: 'esm' })],
      dirs: ['src/components'],
      extensions: ['vue'],
      dts: false
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{js,mjs,ts,vue}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/main.js', 'src/**/*.{test,spec}.{js,vue}', 'src/**/*.d.ts']
    }
  }
})
