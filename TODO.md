# 星语酒馆 H5 复刻 - 工作进度总览

> 项目路径：`/Users/caoyongchao/Desktop/cyc/cy/st-h5`
> 对应小程序：`/Users/caoyongchao/Desktop/cyc/cy/st`

---

## 一、项目概述

### 技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.5 | 前端框架（`<script setup>` + Composition API）|
| Vite | 8.3 | 构建工具 |
| Vant 4 | 4.10 | H5 UI 组件库（对应小程序 `@vant/weapp`）|
| Pinia | 4.0 | 状态管理（对应小程序 `westore`）|
| Vue Router 4 | 4.6 | 路由（对应小程序 `wx.navigateTo`）|
| Axios | 1.20 | HTTP 请求（对应小程序 `wx.request`）|
| marked | 18 | Markdown 解析 |
| postcss-px-to-viewport-8-plugin | 最新 | `px → vw` 适配（375px = 100vw）|

### 编译结果
```
✓ 501 modules transformed.
✓ built in ~1.5s
dist/: 988K（ gzip: ~300K）
```

---

## 二、已完成工作

### 阶段1 ✅ 项目初始化

| 任务 | 状态 | 文件 |
|------|------|------|
| 项目创建（Vue 3 + Vite）| ✅ | `vite.config.js` |
| 技术栈配置 | ✅ | `package.json` |
| Vant 4 按需自动注册 | ✅ | `@vant/auto-import-resolver` |
| `px → vw` 适配（375px = 100vw）| ✅ | `postcss-px-to-viewport-8-plugin` |
| `@` → `src` 别名 | ✅ | `vite.config.js` |
| TabBar 页面占位（4个）| ✅ | `src/views/home/discover/chat-list/usercenter/` |
| 登录页占位 | ✅ | `src/views/login/Login.vue` |
| Pinia 注册 + `useUserStore` | ✅ | `src/store/user.js` |
| 全局样式 | ✅ | `src/styles/_variables.scss` + `global.scss` |
| `document.title` 自动设置 | ✅ | `src/router/index.js` beforeEach |

### 阶段2 ✅ 核心能力层

#### 2.1 wx-adapter.js（全量 API 适配）
**文件**：`src/utils/wx-adapter.js`（~900行）

| 类别 | 实现 API | 策略 |
|------|---------|------|
| **路由** | `navigateTo / redirectTo / switchTab / reLaunch / navigateBack` | 真实实现（Vue Router）|
| **存储** | `getStorageSync / setStorageSync / removeStorageSync` | 真实实现（localStorage）|
| **UI** | `showToast / showLoading / hideLoading / showModal / showActionSheet` | Vant 替代 |
| **系统** | `getSystemInfoSync / getWindowInfo / getAccountInfoSync` | 真实实现 |
| **网络** | `request / uploadFile / downloadFile` | fetch API |
| **媒体** | `chooseImage / chooseMedia / getImageInfo / previewImage` | `input[type=file]` 模拟 |
| **文件** | `getFileSystemManager / getFileInfo / saveImageToPhotosAlbum` | 部分实现 |
| **Canvas** | `canvasToTempFilePath` | DOM canvas 模拟 |
| **音频** | `createInnerAudioContext` | Web Audio API |
| **键盘/事件** | `onKeyboardHeightChange / offKeyboardHeightChange / onAppRoute` | 真实实现 |
| **DOM查询** | `createSelectorQuery` | DOM querySelector 模拟 |
| **剪贴板** | `setClipboardData / getClipboardData` | navigator.clipboard |
| **振动** | `vibrateShort / vibrateLong` | navigator.vibrate |
| **客服** | `openCustomerServiceChat` | window.open |
| **登录** | `login / getSetting / authorize / openSetting / getUserProfile` | mock / stub |
| **导航栏** | `setNavigationBarTitle` | document.title |
| **事件上报** | `reportEvent` | console.log stub |
| **支付** | `requestPayment` | mock confirm |
| **其他** | `exitMiniProgram / getUpdateManager / canIUse` | stub |

#### 2.2 网络请求层
**文件**：`src/api/http.js`

- **axios 实例**：Token 拦截器自动注入 `Authorization: Bearer token`
- **响应拦截器**：业务码 200 → 返回 data；10006/10007/10009 → 积分不足；401 → `h5:auth-required` 事件
- **SSE 流式**：`fetch + ReadableStream` + `StreamParser` 类（按 `\n\n` 分隔事件）
- **API**：`.request / .get / .post / .put / .delete / .postStream`

#### 2.3 业务接口
**文件**：`src/api/*.js`（16 个）

| 文件 | 接口数量 | 功能 |
|------|---------|------|
| `ai/chat.js` | 25+ | AI 对话（流式 sendMessage / retellMessage）|
| `role/index.js` | 28 | 角色 CRUD |
| `group/index.js` | 12 | 群聊管理 |
| `usercenter/index.js` | 27 | 登录/VIP/收益/积分/未成年人 |
| `vip/index.js` | 3 | 积分查询 |
| `order/index.js` | 5 | 订单 |
| `order/orderConfirm.js` | 3 | 订单确认 |
| `feedback/index.js` | 2 | 反馈 |
| `file/index.js` | 4 | 文件上传 |
| `home/home.js` | 2 | 首页 |
| `tts/index.js` | 1 | 语音合成 |
| `comments/fetchComments.js` | 1 | 评论 |
| `comments/fetchCommentsCount.js` | 1 | 评论数 |
| `agreement/agreement.js` | 1 | 协议 |
| `config.js` | - | 后端地址配置 |

#### 2.4 工具层
**文件**：`src/utils/*.js`

| 文件 | 功能 |
|------|------|
| `wx-adapter.js` | wx API 全量适配（见 2.1）|
| `router-bridge.js` | 路由桥接（解循环依赖）|
| `system.js` | 系统信息（getPageInfo / getContentHeight）|
| `util.js` | 工具函数（formatTime / throttle / deepClone / copyToClipboard）|
| `getPermission.js` | 权限获取 |
| `agreement.js` | 协议跳转 |

#### 2.5 用户状态
**文件**：`src/store/user.js`（Pinia）

- `isLogin` getter
- `initFromLocal()` — 从 localStorage 恢复登录态
- `setLoginSuccess()` — 登录成功 + 刷新 VIP/积分
- `refreshVipInfo()` — 调用 `getMyVipInfo` API
- `refreshPointInfo()` — 调用 `getMyPointInfo` API
- `clearAuth()` — 401 时清理登录态
- 监听 `h5:auth-required` → 自动弹出登录弹窗

### 阶段3 ✅ 页面翻译

#### 3.1 路由配置
**文件**：`src/router/index.js`（52 条路由）

```
主包（4个TabBar）：
  /pages/home/home
  /pages/discover/index
  /pages/chat-list/index
  /pages/usercenter/index

分包 /pages/chat（聊天核心）
  /pages/chat/index

分包 /pages/role（角色管理）11个
分包 /pages/group（群聊管理）6个
分包 /pages/vip（会员）4个
分包 /pages/common（通用）6个
分包 /pages/points（积分）3个
分包 /pages/contentadd（发布）4个
分包 /pages/order（订单）1个
分包 /pages/share（分享）2个
分包 /pages/lock（锁屏）2个
分包 /pages/usercenter（个人中心子页）1个
其他一级页面 3个
```

#### 3.2 页面组件（50个 Vue 文件）

| 页面 | 状态 | 说明 |
|------|------|------|
| `views/home/Home.vue` | ✅ 完整实现 | 登录态、ChatPlaceholder、未成年提醒、活动弹窗 |
| `views/discover/Discover.vue` | ✅ 完整实现 | 搜索入口、跳转 |
| `views/chat-list/ChatList.vue` | ✅ 完整实现 | 列表占位、跳转 |
| `views/usercenter/UserCenter.vue` | ✅ 完整实现 | VIP/订单/积分/资料/关于完整菜单 |
| `views/login/Login.vue` | ✅ 完整实现 | mock 登录 |
| 其余 45 个页面 | 🔶 骨架占位 | CustomNav + PagePlaceholder，阶段4 填充业务 |

#### 3.3 共享组件（5个）

| 组件 | 功能 |
|------|------|
| `CustomNav.vue` | 自定义顶部导航（状态栏 + 标题 + 返回按钮）|
| `CustomTabBar.vue` | 自定义底部 TabBar（Vant Tabbar）|
| `AuthDialog.vue` | 登录弹窗（微信登录 + 手机号绑定）|
| `ChatPlaceholder.vue` | 聊天占位组件（阶段4 替换为真实 Chat）|
| `PagePlaceholder.vue` | 通用页面占位组件 |

#### 3.4 App.vue 全局布局
- `AuthDialog` 自动注册（监听 `h5:show-login-modal` 事件）
- 路由 `<transition>` 过渡动画
- `CustomTabBar` 按 `route.meta.tabBar` 智能显示/隐藏

---

## 三、后续代办工作

### 阶段4 🔴 高优先级（聊天核心）

#### 4.1 聊天核心组件（~2000行）
**目标**：完成 `src/components/Chat.vue`（对应小程序 `components/chat/index`）

| 子任务 | 文件 | 工作量 |
|--------|------|--------|
| 滚动区域 + 消息列表 | `Chat.vue` template | ~200行 |
| 角色信息栏 | `Chat.vue` template | ~30行 |
| 蒙版操作按钮（回溯/新剧情/复制）| `Chat.vue` + mask 相关 | ~100行 |
| 自由复制弹窗 | `Chat.vue` | ~30行 |
| SSE 流式消息追加 | `Chat.vue` 流式逻辑 | ~150行 |
| 思考过程渲染（流式）| `Chat.vue` thinkContent | ~50行 |
| 键盘高度监听 + 布局自适应 | `Chat.vue` | ~30行 |
| 消息操作（回溯/重说/继续）| `Chat.vue` | ~100行 |
| 分页加载更多 | `Chat.vue` | ~50行 |

#### 4.2 聊天子组件
| 组件 | 对应小程序 | 功能 |
|------|-----------|------|
| `RoleMsg.vue` | `components/chat/role-msg/index` | AI 角色消息渲染（气泡/头像/思考过程）|
| `UserMsg.vue` | `components/chat/user-msg/index` | 用户消息渲染（气泡/图片）|
| `InputBox.vue` | `components/chat/input-box/index` | 输入框 + 工具栏 |
| `RoleBar.vue` | （群聊角色条）| 群聊角色切换 |

#### 4.3 通用弹窗组件
| 组件 | 对应小程序 | 功能 |
|------|-----------|------|
| `TipDialog.vue` | `components/tip-dialog/index` | 确认提示框 |
| `InputSheet.vue` | `components/input-sheet/index` | 输入弹层（创建剧情）|
| `SelectSheet.vue` | `components/select-sheet/index` | 选择弹层（重说选项）|
| `StoryDialog.vue` | `components/story-dialog/index` | 剧情选择 |
| `ModelSheet.vue` | `components/model-sheet/index` | AI 模型选择 |
| `PointsRechargeDialog.vue` | `components/points-recharge-dialog/index` | 积分充值 |
| `ModelErrDialog.vue` | `components/model-err-dialog/index` | 模型错误提示 |

#### 4.4 群聊组件
| 组件 | 对应小程序 | 功能 |
|------|-----------|------|
| `GroupChat.vue` | `components/group-chat/index` | 群聊核心（含角色切换）|

### 阶段5 🟡 中优先级（角色 + 群聊业务）

#### 5.1 角色分包（11个页面完整实现）
| 页面 | 优先级 | 说明 |
|------|--------|------|
| `role/role-detail/Index.vue` | 🔴 高 | 角色详情（含关注/聊天入口）|
| `role/add/Index.vue` | 🔴 高 | 创建角色（含图片上传）|
| `role/add/role-setting/Index.vue` | 🔴 高 | 角色设置（基础信息/简介/标签）|
| `role/story/Index.vue` | 🟡 中 | 世界观编辑 |
| `role/chat-setting/Index.vue` | 🟡 中 | 聊天设置（自动播放/回复等）|
| `role/chat-style/Index.vue` | 🟡 中 | 聊天风格列表 |
| `role/chat-style/add/Index.vue` | 🟡 中 | 添加聊天风格 |
| `role/voice-list/Index.vue` | 🟡 中 | 音色列表 |
| `role/world-book/Index.vue` | 🟡 中 | 词库 |
| `role/world-book-edit/Index.vue` | 🟡 中 | 词条编辑 |
| `role/plot/Index.vue` | 🟡 中 | 剧情管理 |
| `role/my-setting/Index.vue` | 🟡 中 | 我的设置 |

#### 5.2 群聊分包（6个页面完整实现）
| 页面 | 优先级 | 说明 |
|------|--------|------|
| `group/detail/Index.vue` | 🔴 高 | 群聊详情 |
| `group/add/Index.vue` | 🔴 高 | 创建群聊 |
| `group/role-select/Index.vue` | 🟡 中 | 选择角色 |
| `group/chat/Index.vue` | 🔴 高 | 群聊页面（复用 Chat.vue）|
| `group/story/Index.vue` | 🟡 中 | 世界观 |
| `group/plot/Index.vue` | 🟡 中 | 剧情 |

### 阶段6 🟡 中优先级（VIP + 订单）

#### 6.1 VIP 分包（4个页面完整实现）
| 页面 | 优先级 | 说明 |
|------|--------|------|
| `vip/packages/Index.vue` | 🔴 高 | 套餐列表 + 购买流程 |
| `vip/order-confirm/Index.vue` | 🔴 高 | 订单确认 |
| `vip/payment-status/Index.vue` | 🟡 中 | 支付状态 |
| `vip/times-detail/Index.vue` | 🟡 中 | 次数明细 |

#### 6.2 订单分包
| 页面 | 优先级 |
|------|--------|
| `order/myOrders/Index.vue` | 🟡 中 |

#### 6.3 积分分包
| 页面 | 优先级 |
|------|--------|
| `points/Index.vue` | 🟡 中 |
| `points/detail/Index.vue` | 🟡 中 |
| `points/role-detail/Index.vue` | 🟡 中 |

### 阶段7 ✅ 已完成（通用功能 17个页面 + 工具）

#### 7.1 内容发布（4个页面）
| 页面 | 状态 | 说明 |
|------|------|------|
| `contentadd/Index.vue` | ✅ | 发布内容入口（评分/笔记要求/图片上传/模板选择） |
| `contentadd/blog/Index.vue` | ✅ | 写博客（博主类型 Picker / 风格 ActionSheet / 图片 / 历史）|
| `contentadd/theme/Index.vue` | ✅ | 选主题（Tab 分类 + 无限滚动 + 数据回传）|
| `contentadd/style/Index.vue` | ✅ | 选风格（列表 + 数据回传）|

#### 7.2 发现页（3个页面）
| 页面 | 状态 | 说明 |
|------|------|------|
| `discover/Discover.vue` | ✅ | 角色广场 + 群聊 Tab + 筛选 + 活动弹窗 |
| `discover/search/Index.vue` | ✅ | 搜索（历史/热搜/排行榜预览 + 搜索结果）|
| `discover/rank/Index.vue` | ✅ | 排行榜（热度/哇塞/新秀 Tab + 无限滚动）|

#### 7.3 其他通用页面（10个页面）
| 页面 | 状态 | 说明 |
|------|------|------|
| `share/Index.vue` | ✅ | 分享页（邀请状态/邀请码生成/活动入口/弹幕）|
| `share/record/Index.vue` | ✅ | 邀请记录（无限滚动）|
| `lock/Index.vue` | ✅ | 锁屏解锁（手势 / PIN 切换）|
| `lock/set/Index.vue` | ✅ | 锁屏设置（开关 / 设置 / 清除密码）|
| `star-yao-ji/Index.vue` | ✅ | 星耀酒馆（公告 / 三栏数据 / 成就 / 星空动画）|
| `usercenter/edit/Index.vue` | ✅ | 编辑资料（昵称 / 头像上传）|
| `common/aboutus/Index.vue` | ✅ | 关于我们（设置菜单 / 模型选择 / 全屏 / 自动播放 / 注销）|
| `common/agreement/Index.vue` | ✅ | 协议（隐私 / 免责 / 用户协议 富文本渲染）|
| `common/feedback/Index.vue` | ✅ | 意见反馈 |
| `common/cropper/Index.vue` | ✅ | 图片裁剪（Canvas 缩放/平移/裁剪）|
| `common/pic-generate/Index.vue` | ✅ | 图片生成（风格选择 / 提示词优化）|
| `common/pic-generate/result/Index.vue` | ✅ | 图片生成结果页 |

#### 7.4 通用工具
| 工具 | 说明 |
|------|------|
| `src/utils/fileUploader.js` | 文件上传（PUT 预签 / 进度 / 二次确认），适配小程序 `fileUploader.js` |

#### 7.5 静态资源迁移
- 小程序 `static/` → `st-h5/public/static/`（已完成）
- 缺失资源（`invite_card.png` / `avatar_add.png` / `avatar.jpg` / `empty-data.png`）已用 `user_icon.png` 占位兜底，或改为 CSS 渐变背景

### 阶段8 ✅ 已完成（扫尾与优化 9 项）

| 任务 | 状态 | 说明 |
|------|------|------|
| ~~静态资源迁移~~ | ✅ | 已在阶段7 完成 |
| **Vant 按需引入完善** | ✅ | 安装 `unplugin-auto-import` + 复用 `unplugin-vue-components`，Vue / Vue Router / Vant 函数 API 自动按需引入 |
| **路由滚动行为** | ✅ | `router.scrollBehavior` 支持 `savedPosition` 恢复 + `to.hash` 锚点平滑滚动 + 普通跳转重置顶部 |
| **主题色适配** | ✅ | 新增 `src/store/theme.js`（light / dark / system），`global.scss` 全部色值 CSS 变量化，`html[data-theme="dark"]` 覆盖，关于我们页提供切换入口 |
| **VConsole 调试** | ✅ | 新增 `src/utils/vconsole.js`，开发模式自动启用 / `?vconsole=1` / `localStorage.vconsole=1` 启用 |
| **PWA 支持** | ✅ | `vite-plugin-pwa` + `public/manifest.json`，Workbox 自动生成 SW，图片 CacheFirst / API NetworkFirst |
| **微信 JS-SDK** | ✅ | 新增 `src/utils/wechat-jssdk.js`（含 setupWechat / shareToWechat / wxPay / scanQRCode），仅在微信内加载 jweixin，非微信环境降级到 navigator.share / 复制 |
| **单元测试** | ✅ | Vitest + happy-dom + @vue/test-utils，2 套测试文件 18 用例全通过（utils/util + store/theme）|
| **E2E 测试** | ✅ | Playwright 配置 + Pixel 7 / iPhone 13 / Desktop Chrome 三套设备，`e2e/smoke.spec.js` 覆盖首页加载 / TabBar 跳转 / 404 回退 / PWA manifest |

---

## 四、剩余组件清单（按优先级排序）

> 对应小程序 `components/` 目录，共 42 个组件

### 🔴 必须实现（聊天核心）
```
chat/index.js         (1437行) ← 最大优先级
chat/input-box/       (~400行)
chat/role-msg/        (~200行)
chat/user-msg/        (~150行)
```

### 🔴 高优先级
```
auth/                 (193行) ← AuthDialog 已部分实现，可完善
select-sheet/         (476行)
story-dialog/        (168行)
tip-dialog/           (93行)
input-sheet/         (109行)
model-sheet/         (136行)
minor-tip-dialog/     (135行)
points-recharge-dialog/ (134行)
richtext-dialog/      (168行)
group-chat/          (631行)
swipeout/            (~200行)
```

### 🟡 中优先级
```
background-sheet/     (111行)
image-uploader/       (200行)
uploader/            (140行)
webp-image/           (~80行)
memory-sheet/        (176行)
create-select-dialog/ (~100行)
logoff-dialog/        (~100行)
recharge-result-dialog/ (100行)
contact-service-dialog/ (~80行)
share-dialog/         (~80行)
invite-code-dialog/  (~80行)
group-authorize-dialog/ (~160行)
model-err-dialog/     (~80行)
text-optimizer/      (~130行)
activity-dialog/      (~80行)
group-avatar/        (~80行)
```

### 🟢 低优先级（可复用现有库）
```
custom-nav/          (133行) ← CustomNav 已实现
filter/              (84行)
filter-popup/        (~80行)
loading-content/     (~80行)
load-more/            (~60行)
autoreply-desc-overlay/ (~60行)
common-dialog-content/ (~60行)
custom-rate/         (89行)
price/               (~60行)
role-hot-container/  (~60行)
memory-desc-overlay/ (~60行)
model-display/       (~60行)
optimize-btn/        (~60行)
```

---

## 五、进度总览

```
[████████████████████] 阶段1 ✅ 完成（项目初始化）
[████████████████████] 阶段2 ✅ 完成（核心能力层）
[████████████████████] 阶段3 ✅ 完成（页面翻译 50/50）

[████████████████████] 阶段4 ✅ 完成（聊天核心组件）
  ├── Chat.vue          ✅ (~1100行)
  ├── InputBox.vue      ✅ (~350行)
  ├── RoleMsg.vue       ✅ (~250行)
  ├── UserMsg.vue       ✅ (~150行)
  ├── GroupChat.vue     ✅ (~400行)
  ├── GroupRoleMsg.vue  ✅ (~150行)
  ├── TipDialog.vue     ✅
  ├── InputSheet.vue    ✅
  ├── SelectSheet.vue   ✅
  ├── StoryDialog.vue  ✅
  ├── ModelSheet.vue   ✅
  ├── PointsRechargeDialog.vue ✅
  └── ModelErrDialog.vue ✅

[████████████████████] 阶段5   ✅ 完成（已完成17个页面）（角色 + 群聊）
[                              ]   ├── 角色详情          ✅ role/role-detail/Index.vue
  ├── 创建角色          ✅ role/add/Index.vue
  ├── 角色设定          ✅ role/add/role-setting/Index.vue
  ├── 剧情列表          ✅ role/plot/Index.vue
  ├── 聊天设定          ✅ role/chat-setting/Index.vue
  ├── 聊天风格列表      ✅ role/chat-style/Index.vue
  ├── 添加聊天风格      ✅ role/chat-style/add/Index.vue
  ├── 音色列表          ✅ role/voice-list/Index.vue
  ├── 词库              ✅ role/world-book/Index.vue
  ├── 词条编辑          ✅ role/world-book-edit/Index.vue
  ├── 角色故事          ✅ role/story/Index.vue
  ├── 我的设定          ✅ role/my-setting/Index.vue
  ├── 群聊详情          ✅ group/detail/Index.vue
  ├── 创建群聊          ✅ group/add/Index.vue
  ├── 选择角色          ✅ group/role-select/Index.vue
  ├── 群聊聊天          ✅ group/chat/Index.vue
  ├── 群聊故事          ✅ group/story/Index.vue
  └── 群聊剧情          ✅ group/plot/Index.vue
[████████████████████] 阶段6   ✅ 完成（VIP + 订单 + 积分 7个页面）
[                              ]   ├── VIP套餐列表      ✅ vip/packages/Index.vue
  ├── 订单确认          ✅ vip/order-confirm/Index.vue
  ├── 支付状态          ✅ vip/payment-status/Index.vue
  ├── 次数明细          ✅ vip/times-detail/Index.vue
  ├── 我的订单          ✅ order/myOrders/Index.vue
  ├── 积分中心          ✅ points/Index.vue
  ├── 积分明细          ✅ points/detail/Index.vue
  └── 角色积分明细      ✅ points/role-detail/Index.vue

[████████████████████] 阶段7 ✅ 完成（通用功能 17个页面 + fileUploader 工具 + 静态资源迁移）
[                              ]   ├── 内容发布入口       ✅ contentadd/Index.vue
  ├── 写博客              ✅ contentadd/blog/Index.vue
  ├── 选主题              ✅ contentadd/theme/Index.vue
  ├── 选风格              ✅ contentadd/style/Index.vue
  ├── 发现主页            ✅ discover/Discover.vue
  ├── 搜索                ✅ discover/search/Index.vue
  ├── 排行榜              ✅ discover/rank/Index.vue
  ├── 分享                ✅ share/Index.vue
  ├── 邀请记录            ✅ share/record/Index.vue
  ├── 锁屏                ✅ lock/Index.vue
  ├── 锁屏设置            ✅ lock/set/Index.vue
  ├── 星耀酒馆            ✅ star-yao-ji/Index.vue
  ├── 编辑资料            ✅ usercenter/edit/Index.vue
  ├── 关于我们            ✅ common/aboutus/Index.vue
  ├── 协议（富文本）       ✅ common/agreement/Index.vue
  ├── 意见反馈            ✅ common/feedback/Index.vue
  ├── 图片裁剪            ✅ common/cropper/Index.vue
  ├── 图片生成            ✅ common/pic-generate/Index.vue
  ├── 图片生成结果         ✅ common/pic-generate/result/Index.vue
  └── 文件上传工具         ✅ utils/fileUploader.js

[████████████████████] 阶段8 ✅ 完成（扫尾与优化 9 项）
[                              ]   ├── Vant 按需引入完善     ✅ unplugin-auto-import
  ├── 路由 scrollBehavior   ✅ router/index.js
  ├── 主题色 dark/light     ✅ store/theme.js + global.scss
  ├── VConsole 调试          ✅ utils/vconsole.js
  ├── PWA 支持              ✅ vite-plugin-pwa + manifest.json
  ├── 微信 JS-SDK           ✅ utils/wechat-jssdk.js
  ├── 单元测试              ✅ vitest 18 用例全通过
  └── E2E 测试              ✅ playwright + 3 套设备

[████████████████████] 阶段9 ✅ 完成（布局/样式修复 + 占位页实现）
[                              ]   ├── rpx→vw 转换基建     ✅ vite 插件 + postcss 插件
  ├── 设计令牌 tokens.scss   ✅ 字号/颜色/间距统一
  ├── 发现页修复             ✅ discover/Discover.vue
  ├── 聊天列表页修复         ✅ chat-list/ChatList.vue
  ├── 用户中心重构           ✅ usercenter/UserCenter.vue（含角色/群聊 Tab + 状态角标）
  ├── 会员套餐页实现         ✅ vip/packages/Index.vue
  ├── 订单确认页实现         ✅ vip/order-confirm/Index.vue
  ├── 支付状态页实现         ✅ vip/payment-status/Index.vue
  ├── 次数明细页实现         ✅ vip/times-detail/Index.vue
  ├── 我的订单页实现         ✅ order/myOrders/Index.vue
  ├── 积分中心页实现         ✅ points/Index.vue
  ├── 积分明细页实现         ✅ points/detail/Index.vue
  ├── 角色积分明细页实现     ✅ points/role-detail/Index.vue
  ├── 编辑资料页实现         ✅ usercenter/edit/Index.vue
  ├── 意见反馈页实现         ✅ common/feedback/Index.vue
  └── GET 参数 bug 修复      ✅ api/http.js

🎉 项目全部 9 个阶段完成

## 六、启动命令

```bash
cd /Users/caoyongchao/Desktop/cyc/cy/st-h5

# 开发
npm run dev               # http://localhost:5173

# 生产构建
npm run build             # dist/ 含 PWA precache ~1.7M

# 预览构建产物
npm run preview           # http://localhost:4173

# 测试
npm run test              # Vitest 单元测试
npm run test:watch        # 监听模式
npm run test:coverage     # 生成覆盖率报告
npm run test:e2e          # Playwright E2E（自动 build + preview）

# 调试模式
# URL 加 ?vconsole=1 或 localStorage.setItem('vconsole', '1') 启用 VConsole
```

---

## 七、目录结构（当前）

```
st-h5/
├── src/
│   ├── api/                          # 16 个接口文件
│   │   ├── http.js                   # axios + SSE
│   │   ├── config.js                 # 后端地址
│   │   ├── ai/chat.js               # AI 对话
│   │   ├── role/index.js            # 角色
│   │   ├── group/index.js           # 群聊
│   │   ├── usercenter/index.js      # 用户中心
│   │   ├── vip/index.js             # VIP
│   │   ├── order/                   # 订单
│   │   ├── feedback/                 # 反馈
│   │   ├── file/                    # 文件
│   │   ├── home/home.js             # 首页
│   │   ├── tts/                    # TTS
│   │   ├── comments/                 # 评论
│   │   └── agreement/               # 协议
│   ├── views/                        # 50 个页面
│   │   ├── home/Home.vue           ✅ 完整
│   │   ├── discover/                 # 发现（Discover 完整）
│   │   ├── chat-list/              ✅ 完整
│   │   ├── usercenter/             ✅ 完整
│   │   ├── login/Login.vue         ✅ 完整
│   │   ├── chat/Index.vue           ✅ 完整实现（使用 Chat 组件）
│   │   ├── role/                   🔶 骨架（11个页面）
│   │   ├── group/                  🔶 骨架（6个页面）
│   │   ├── vip/                    🔶 骨架（4个页面）
│   │   ├── common/                 🔶 骨架（6个页面）
│   │   └── ...（其他 20+ 页面）
│   ├── components/                   # 18 个组件（阶段4新增13个）
│   │   ├── CustomNav.vue           ✅ 完整
│   │   ├── CustomTabBar.vue        ✅ 完整
│   │   ├── AuthDialog.vue          ✅ 完整
│   │   ├── ChatPlaceholder.vue     🔶 占位
│   │   ├── PagePlaceholder.vue     ✅ 通用
│   │   ├── chat/                   ✅ 聊天核心（6个组件）
│   │   │   ├── Chat.vue          ✅
│   │   │   ├── InputBox.vue       ✅
│   │   │   ├── RoleMsg.vue        ✅
│   │   │   ├── UserMsg.vue        ✅
│   │   │   ├── GroupChat.vue       ✅
│   │   │   └── GroupRoleMsg.vue    ✅
│   │   └── dialogs/                ✅ 弹窗组件（7个）
│   │       ├── TipDialog.vue      ✅
│   │       ├── InputSheet.vue     ✅
│   │       ├── SelectSheet.vue    ✅
│   │       ├── StoryDialog.vue    ✅
│   │       ├── ModelSheet.vue     ✅
│   │       ├── PointsRechargeDialog.vue ✅
│   │       └── ModelErrDialog.vue ✅
│   ├── store/
│   │   ├── user.js               ✅ 完整（Pinia）
│   │   └── theme.js              ✅ 深色/浅色/跟随系统
│   ├── utils/                       # 7 个工具文件
│   │   ├── wx-adapter.js          ✅ 900行 35+ API
│   │   ├── router-bridge.js       ✅
│   │   ├── system.js              ✅
│   │   ├── util.js                ✅
│   │   ├── getPermission.js        ✅
│   │   ├── agreement.js            ✅
│   │   ├── fileUploader.js        ✅ 预签 PUT 上传
│   │   ├── vconsole.js            ✅ 调试工具
│   │   └── wechat-jssdk.js        ✅ 微信环境 SDK 适配
│   ├── styles/                     # 全局样式
│   │   ├── _variables.scss        ✅ SCSS 变量
│   │   └── global.scss            ✅ 全局样式（含主题变量）
│   ├── router/index.js             ✅ 52 条路由 + scrollBehavior
│   ├── App.vue                     ✅ 全局布局
│   ├── main.js                     ✅ 入口（含主题/VConsole/JSSDK 启动）
│   └── auto-imports.d.ts           ✅ 自动生成类型
├── public/                          # 静态资源
│   ├── manifest.json              ✅ PWA manifest
│   └── static/                    ✅ 小程序 static 全部资源
├── e2e/                              # E2E 测试
│   └── smoke.spec.js              ✅ 冒烟测试
├── index.html                       # 含 PWA meta
├── vite.config.js                  # 含 PWA / 自动导入配置
├── vitest.config.js                ✅ 单元测试
├── playwright.config.js            ✅ E2E 测试
├── package.json                     # 含 test/test:e2e 脚本
├── TODO.md                         ← 本文件
└── README.md
```

---

*最后更新：2026-09-21（全部阶段完成）*
