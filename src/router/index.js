// 路由配置（对应小程序 app.json 的 pages + tabBar + subPackages）
// 阶段3：注册全部页面路由
import { createRouter, createWebHistory } from 'vue-router'

export { router } // named export，供 wx-adapter 延迟引用

const routes = [
  { path: '/', redirect: '/pages/home/home' },

  // ===== TabBar 页面（对应 app.json tabBar.list） =====
  {
    path: '/pages/home/home',
    name: 'Home',
    component: () => import('@/views/home/Home.vue'),
    meta: { title: '首页', tabBar: true, index: 0 }
  },
  {
    path: '/pages/discover/index',
    name: 'Discover',
    component: () => import('@/views/discover/Discover.vue'),
    meta: { title: '发现', tabBar: true, index: 1 }
  },
  {
    path: '/pages/chat-list/index',
    name: 'ChatList',
    component: () => import('@/views/chat-list/ChatList.vue'),
    meta: { title: '聊天', tabBar: true, index: 2 }
  },
  {
    path: '/pages/usercenter/index',
    name: 'UserCenter',
    component: () => import('@/views/usercenter/UserCenter.vue'),
    meta: { title: '我的', tabBar: true, index: 3 }
  },

  // ===== 一级页面（对应 pages[]）=====
  {
    path: '/pages/star-yao-ji/index',
    name: 'StarYaoJi',
    component: () => import('@/views/star-yao-ji/Index.vue'),
    meta: { title: '星耀酒馆' }
  },
  {
    path: '/pages/points/index',
    name: 'Points',
    component: () => import('@/views/points/Index.vue'),
    meta: { title: '积分中心' }
  },
  {
    path: '/pages/lock/index',
    name: 'Lock',
    component: () => import('@/views/lock/Index.vue'),
    meta: { title: '锁屏' }
  },
  {
    path: '/pages/lock/set/index',
    name: 'LockSet',
    component: () => import('@/views/lock/set/Index.vue'),
    meta: { title: '设置锁屏' }
  },

  // ===== 分包：share =====
  {
    path: '/pages/share/index',
    name: 'Share',
    component: () => import('@/views/share/Index.vue'),
    meta: { title: '分享' }
  },
  {
    path: '/pages/share/record/index',
    name: 'ShareRecord',
    component: () => import('@/views/share/record/Index.vue'),
    meta: { title: '分享记录' }
  },

  // ===== 分包：contentadd =====
  {
    path: '/pages/contentadd/index',
    name: 'ContentAdd',
    component: () => import('@/views/contentadd/Index.vue'),
    meta: { title: '发布内容' }
  },
  {
    path: '/pages/contentadd/blog/index',
    name: 'ContentAddBlog',
    component: () => import('@/views/contentadd/blog/Index.vue'),
    meta: { title: '写博客' }
  },
  {
    path: '/pages/contentadd/theme/index',
    name: 'ContentAddTheme',
    component: () => import('@/views/contentadd/theme/Index.vue'),
    meta: { title: '选主题' }
  },
  {
    path: '/pages/contentadd/style/index',
    name: 'ContentAddStyle',
    component: () => import('@/views/contentadd/style/Index.vue'),
    meta: { title: '选风格' }
  },

  // ===== 分包：order =====
  {
    path: '/pages/order/myOrders/index',
    name: 'MyOrders',
    component: () => import('@/views/order/myOrders/Index.vue'),
    meta: { title: '我的订单' }
  },

  // ===== 分包：role =====
  {
    path: '/pages/role/role-detail/index',
    name: 'RoleDetail',
    component: () => import('@/views/role/role-detail/Index.vue'),
    meta: { title: '智能体详情' }
  },
  {
    path: '/pages/role/add/index',
    name: 'RoleAdd',
    component: () => import('@/views/role/add/Index.vue'),
    meta: { title: '创建智能体' }
  },
  {
    path: '/pages/role/add/role-setting/index',
    name: 'RoleSetting',
    component: () => import('@/views/role/add/role-setting/Index.vue'),
    meta: { title: '智能体设置' }
  },
  {
    path: '/pages/role/story/index',
    name: 'RoleStory',
    component: () => import('@/views/role/story/Index.vue'),
    meta: { title: '世界观' }
  },
  {
    path: '/pages/role/my-setting/index',
    name: 'RoleMySetting',
    component: () => import('@/views/role/my-setting/Index.vue'),
    meta: { title: '我的设置' }
  },
  {
    path: '/pages/role/chat-setting/index',
    name: 'RoleChatSetting',
    component: () => import('@/views/role/chat-setting/Index.vue'),
    meta: { title: '聊天设置' }
  },
  {
    path: '/pages/role/chat-style/index',
    name: 'RoleChatStyle',
    component: () => import('@/views/role/chat-style/Index.vue'),
    meta: { title: '聊天风格' }
  },
  {
    path: '/pages/role/chat-style/add/index',
    name: 'RoleChatStyleAdd',
    component: () => import('@/views/role/chat-style/add/Index.vue'),
    meta: { title: '添加聊天风格' }
  },
  {
    path: '/pages/role/voice-list/index',
    name: 'RoleVoiceList',
    component: () => import('@/views/role/voice-list/Index.vue'),
    meta: { title: '音色列表' }
  },
  {
    path: '/pages/role/world-book/index',
    name: 'RoleWorldBook',
    component: () => import('@/views/role/world-book/Index.vue'),
    meta: { title: '词库' }
  },
  {
    path: '/pages/role/world-book-edit/index',
    name: 'RoleWorldBookEdit',
    component: () => import('@/views/role/world-book-edit/Index.vue'),
    meta: { title: '编辑词条' }
  },
  {
    path: '/pages/role/plot/index',
    name: 'RolePlot',
    component: () => import('@/views/role/plot/Index.vue'),
    meta: { title: '剧情' }
  },

  // ===== 分包：group =====
  {
    path: '/pages/group/add/index',
    name: 'GroupAdd',
    component: () => import('@/views/group/add/Index.vue'),
    meta: { title: '创建群聊' }
  },
  {
    path: '/pages/group/role-select/index',
    name: 'GroupRoleSelect',
    component: () => import('@/views/group/role-select/Index.vue'),
    meta: { title: '选择角色' }
  },
  {
    path: '/pages/group/chat/index',
    name: 'GroupChat',
    component: () => import('@/views/group/chat/Index.vue'),
    meta: { title: '群聊' }
  },
  {
    path: '/pages/group/detail/index',
    name: 'GroupDetail',
    component: () => import('@/views/group/detail/Index.vue'),
    meta: { title: '群聊详情' }
  },
  {
    path: '/pages/group/story/index',
    name: 'GroupStory',
    component: () => import('@/views/group/story/Index.vue'),
    meta: { title: '世界观' }
  },
  {
    path: '/pages/group/plot/index',
    name: 'GroupPlot',
    component: () => import('@/views/group/plot/Index.vue'),
    meta: { title: '剧情' }
  },

  // ===== 分包：vip =====
  {
    path: '/pages/vip/packages/index',
    name: 'VipPackages',
    component: () => import('@/views/vip/packages/Index.vue'),
    meta: { title: '会员套餐' }
  },
  {
    path: '/pages/vip/payment-status/index',
    name: 'VipPaymentStatus',
    component: () => import('@/views/vip/payment-status/Index.vue'),
    meta: { title: '支付状态' }
  },
  {
    path: '/pages/vip/order-confirm/index',
    name: 'VipOrderConfirm',
    component: () => import('@/views/vip/order-confirm/Index.vue'),
    meta: { title: '确认订单' }
  },
  {
    path: '/pages/vip/times-detail/index',
    name: 'VipTimesDetail',
    component: () => import('@/views/vip/times-detail/Index.vue'),
    meta: { title: '次数明细' }
  },

  // ===== 分包：common =====
  {
    path: '/pages/common/aboutus/index',
    name: 'AboutUs',
    component: () => import('@/views/common/aboutus/Index.vue'),
    meta: { title: '关于我们' }
  },
  {
    path: '/pages/common/agreement/index',
    name: 'Agreement',
    component: () => import('@/views/common/agreement/Index.vue'),
    meta: { title: '用户协议' }
  },
  {
    path: '/pages/common/cropper/index',
    name: 'Cropper',
    component: () => import('@/views/common/cropper/Index.vue'),
    meta: { title: '图片裁剪' }
  },
  {
    path: '/pages/common/pic-generate/index',
    name: 'PicGenerate',
    component: () => import('@/views/common/pic-generate/Index.vue'),
    meta: { title: '图片生成' }
  },
  {
    path: '/pages/common/pic-generate/result/index',
    name: 'PicGenerateResult',
    component: () => import('@/views/common/pic-generate/result/Index.vue'),
    meta: { title: '生成结果' }
  },
  {
    path: '/pages/common/feedback/index',
    name: 'Feedback',
    component: () => import('@/views/common/feedback/Index.vue'),
    meta: { title: '意见反馈' }
  },

  // ===== 分包：chat（聊天核心页）=====
  {
    path: '/pages/chat/index',
    name: 'Chat',
    component: () => import('@/views/chat/Index.vue'),
    meta: { title: '聊天' }
  },

  // ===== 分包：discover =====
  {
    path: '/pages/discover/search/index',
    name: 'DiscoverSearch',
    component: () => import('@/views/discover/search/Index.vue'),
    meta: { title: '搜索' }
  },
  {
    path: '/pages/discover/rank/index',
    name: 'DiscoverRank',
    component: () => import('@/views/discover/rank/Index.vue'),
    meta: { title: '排行榜' }
  },

  // ===== 分包：usercenter =====
  {
    path: '/pages/usercenter/edit/index',
    name: 'UserEdit',
    component: () => import('@/views/usercenter/edit/Index.vue'),
    meta: { title: '编辑资料' }
  },

  // ===== 分包：points =====
  {
    path: '/pages/points/detail/index',
    name: 'PointsDetail',
    component: () => import('@/views/points/detail/Index.vue'),
    meta: { title: '积分明细' }
  },
  {
    path: '/pages/points/role-detail/index',
    name: 'PointsRoleDetail',
    component: () => import('@/views/points/role-detail/Index.vue'),
    meta: { title: '角色积分详情' }
  },

  // ===== 登录页 =====
  {
    path: '/pages/login/index',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { title: '登录' }
  },

  // 404
  { path: '/:pathMatch(.*)*', redirect: '/pages/home/home' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 路由切换的滚动行为
  // - 后退/前进：恢复历史位置
  // - 普通跳转：滚到顶部（hash 锚点除外）
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 88 }
    }
    return { left: 0, top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
