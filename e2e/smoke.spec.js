// 端到端冒烟测试：基本加载、TabBar 跳转、主题切换
import { test, expect } from '@playwright/test'

test.describe('星语酒馆 H5 - 冒烟测试', () => {
  test('主页加载并显示四个 TabBar', async ({ page }) => {
    await page.goto('/')
    // 默认重定向到 /pages/home/home
    await expect(page).toHaveURL(/\/pages\/home\/home/)
    // 等待 App 挂载完成
    await page.waitForLoadState('networkidle')
    // TabBar 文字
    for (const label of ['首页', '发现', '聊天', '我的']) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 10_000 })
    }
  })

  test('发现 Tab 跳转', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // 通过链接文本点击
    await page.getByText('发现', { exact: false }).first().click()
    await expect(page).toHaveURL(/\/pages\/discover/)
  })

  test('直接访问个人中心', async ({ page }) => {
    await page.goto('/pages/usercenter/index')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/pages\/usercenter/)
  })

  test('404 路由应回退到首页', async ({ page }) => {
    await page.goto('/some/not/exist/path')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/pages\/home\/home/)
  })
})

test.describe('PWA', () => {
  test('manifest.json 可访问', async ({ request }) => {
    const res = await request.get('/manifest.json')
    expect(res.ok()).toBe(true)
    const data = await res.json()
    expect(data.name).toBeTruthy()
    expect(Array.isArray(data.icons)).toBe(true)
  })
})
