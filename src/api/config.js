// config/index.js —— 后端地址配置（对应小程序 config/index.js）
// H5 通过 import.meta.env 区分环境

const devBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:19000'
const prodBase = import.meta.env.VITE_API_BASE_URL || 'https://www.yours-x.com/character'

const isDev = import.meta.env.DEV
const baseUrl = isDev ? devBase : prodBase

// 是否启用 mock（对应小程序 config 中的 useMock）
// 通过 .env 文件中的 VITE_USE_MOCK=true 开启
export const useMock = String(import.meta.env.VITE_USE_MOCK || 'false') === 'true'

export const config = {
  useMock,
  baseUrl
}

export const cdnBase =
  'https://we-retail-static-1300977798.cos.ap-guangzhou.myqcloud.com/retail-mp'

/**
 * 简易 mock 处理器：当 useMock=true 时，对应的 API 路径会返回本地假数据
 * 便于在没有真实后端的情况下进行调试
 *
 * 返回的数据格式需要与后端一致：{ code: 200, data: {...}, msg: 'OK', success: true }
 */
export const mockHandlers = {
  // 登录
  '/api/v1/auth/wx/login': () => ({
    user: {
      id: 1,
      uid: 'mock-uid',
      nickname: '体验用户',
      avatarUrl: 'https://placehold.co/200x200/FF5F15/fff?text=U',
      phone: '13800138000',
      state: '1',
      openId: 'mock-openid'
    },
    token: 'mock-token-' + Date.now(),
    openId: 'mock-openid'
  }),

  // Web 端账号登录（邮箱 + 密码）
  '/api/v1/auth/web/login': (cfg) => {
    let body = cfg.data
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch (e) { body = {} }
    }
    return {
      token: 'mock-web-token-' + Date.now(),
      userId: 10001,
      user: {
        id: 10001,
        uid: '10001',
        email: body?.email || 'mock@example.com',
        nickname: '体验用户',
        status: 1,
        emailVerified: true,
        avatarUrl: ''
      }
    }
  },

  // Web 端注册
  '/api/v1/auth/web/register': (cfg) => {
    let body = cfg.data
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch (e) { body = {} }
    }
    return {
      userId: Date.now(),
      email: body?.email || 'mock@example.com',
      message: '注册成功，请前往邮箱完成验证（mock）'
    }
  },

  // 首页默认剧情
  '/api/v1/server/plot/getDefaultPlotMessage': () => ({
    plotId: 100,
    characterId: 1,
    type: 'history',
    groupChatId: null
  }),

  // 角色详情
  '/api/v1/server/character/getCharacterDetail': () => ({
    id: 1,
    name: '苏夜',
    avatarUrl: 'https://placehold.co/400x400/5B4FE9/fff?text=SN',
    description: '冷峻寡言的剑客，背负家族血仇，意外穿越到现代都市',
    backgroundImage: 'https://placehold.co/750x1334/1a1a2e/eee?text=Role+BG',
    defaultStoryId: 1,
    currentPlotId: 100,
    plotDetailVO: {
      id: 100,
      scene: '夜幕降临在繁华都市的霓虹灯雨中，一位白衣剑客凭空出现在天桥之上',
      backgroundImage: 'https://placehold.co/750x1334/1a1a2e/eee?text=Role+BG',
      updateTime: Date.now()
    },
    defaultStoryDetail: {
      id: 1,
      title: '初次相遇',
      scene: '夜幕降临在繁华都市的霓虹灯雨中，一位白衣剑客凭空出现在天桥之上',
      prologue: '（他环顾四周，眉心微蹙）你是……这里的住民？这座城市，处处透着古怪。',
      defaultBackgroundImage: 'https://placehold.co/750x1334/1a1a2e/eee?text=Role+BG'
    },
    publishStatus: 1,
    isSystem: 1,
    messageCount: 1280,
    browseCount: 9876
  }),

  // 剧情消息列表
  '/api/v1/server/plot/getPlotMessage': () => ({
    records: [],
    total: 0,
    current: 1,
    size: 10,
    pages: 0
  }),

  // VIP 信息
  '/api/v1/user/vip/getMyVipInfo': () => ({
    ifVip: true,
    monthlyRemaining: 9999,
    giftRemaining: 9999,
    monthlyExpireTime: Date.now() + 30 * 86400 * 1000,
    monthlyRemainingDays: 30,
    formattedMonthlyExpireTime: '2026年10月28日'
  }),

  // 积分信息
  '/api/v1/user/vip/getMyPointInfo': () => ({
    dailyFreeBalance: 100,
    pointBalance: 5000,
    dailyFreeBalancePreset: 50
  }),

  // 默认空数据兜底
  default: () => null
}
