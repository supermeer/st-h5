// Web 端登录注册接口（对应文档 /api/v1/auth/web/*）
import http from '@/api/http'

/**
 * 用户注册（基于邮箱，注册成功后会异步发送验证邮件）
 * POST /api/v1/auth/web/register
 * @param {{ email: string, password: string, nickname: string }} data
 */
export function register(data) {
  return http.post('/api/v1/auth/web/register', data)
}

/**
 * 用户登录（邮箱 + 密码）
 * POST /api/v1/auth/web/login
 * @param {{ email: string, password: string, ip?: string }} data
 */
export function loginByEmail(data) {
  console.log(data, '--------')
  return http.post('/api/v1/auth/web/login', data)
}

/**
 * 修改密码（需登录）
 * POST /api/v1/auth/web/change-password
 * @param {{ oldPassword: string, newPassword: string }} data
 */
export function changePassword(data) {
  return http.post('/api/v1/auth/web/change-password', data)
}

/**
 * 重发验证邮件
 * POST /api/v1/auth/web/resend-verification?email=xxx
 * @param {string} email
 */
export function resendVerification(email) {
  return http.post('/api/v1/auth/web/resend-verification', null, { params: { email } })
}

/**
 * 测试环境直接注册（仅 test profile）
 * POST /api/v1/auth/web/register-test
 * @param {{ email: string, password: string, nickname: string }} data
 */
export function registerTest(data) {
  return http.post('/api/v1/auth/web/register-test', data)
}
