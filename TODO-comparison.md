# st（小程序）→ st-h5（H5）功能差异与 TODO 清单

> 生成时间：2026-09-28  
> 对比项目：`C:\Users\Administrator\Desktop\星语酒馆\st`（微信小程序）vs `C:\Users\Administrator\Desktop\星语酒馆\st-h5`（H5 复刻）

---

## 一、对比概况

| 维度 | 小程序 st | H5 st-h5 | 完成度 |
|---|---|---|---|
| 路由页面 (app.json 全部+分包) | ✅ 60+ 页面 | ✅ 已注册 60+ 路由 | 路由层面 **100%** |
| tabBar 4 个 | ✅ 首页/发现/聊天/我的 | ✅ | 已对齐 |
| 业务 services | ✅ 14 个服务目录 | ⚠️ 仅 11 个 api 目录 | **缺 3 个** |
| 复用组件 | ✅ 30+ 个组件 | ⚠️ 仅 9 个顶层组件 + chat/dialogs/common 子目录 | 仍有缺口 |
| 核心业务逻辑 | ✅ 全量 | ⚠️ 多为占位/UI 壳 | 关键路径 **约 50%** |

**核心结论**：H5 已经搭好了**骨架**（路由、tabBar、组件目录、API 调用），但大量页面是**空壳**（placeholder、模拟数据），大量业务逻辑待实现。下面按模块列出待办事项。

---

## 二、按模块拆分的 TODO 清单

### 模块 0：项目基础设施与适配层 🛠

- [ ] **0-1 微信 JSSDK 完整对接**（`utils/wx-adapter.js` → `api/jssdk`）
  - [ ] 对接 `/api/v1/wechat/jssdk/config` 接口
  - [ ] 实现 `wx.config` / `wx.ready` / `wx.error` 处理
  - [ ] 实现 `wx.updateAppMessageShareData`（分享给朋友）
  - [ ] 实现 `wx.updateTimelineShareData`（分享到朋友圈）
  - [ ] 实现 `wx.openCustomerServiceChat`（小程序客服迁移到 H5 微信内）
  - [ ] 处理非微信环境的降级（提示"请在微信中打开"）

- [ ] **0-2 真实登录流程**（`views/login/Login.vue` 目前是模拟）
  - [ ] 微信 OAuth2.0 授权跳转流程
  - [ ] 短信验证码登录替代方案
  - [ ] 与后端 `/api/v1/auth/wx/login` 对接
  - [ ] 手机号绑定（`bindPhoneNumber`）
  - [ ] 游客模式（不登录可浏览）

- [ ] **0-3 wx-adapter 适配层完善**
  - [ ] `wx.scanCode` → H5 调用摄像头扫码
  - [ ] `wx.openLocation` → H5 调用高德/百度地图
  - [ ] `wx.chooseLocation` → H5 选择位置
  - [ ] `wx.requestPayment` → H5 微信 H5 支付
  - [ ] `wx.share` 系列方法（目前 `enableShareAppMessage` 已加但未真接）
  - [ ] `wx.getStorageSync` / `setStorageSync` 已实现，需检查**所有页面**替换

---

### 模块 1：聊天核心（`pages/chat` + `components/chat`）💬

> **现状**：基础 Chat.vue 已搭好，但比小程序 `components/chat/index.js`（1064 行）少很多功能。

#### 1.1 消息功能
- [ ] **1-1-1 点赞/点踩功能**（Chat.vue 中 `case 'like'/'dislike'` 是 TODO）
  - [ ] 调用 `likeMessage` / `dislikeMessage` API（需要在 `api/ai/chat.js` 新增）
  - [ ] UI 状态切换（已点赞显示蓝色）
- [ ] **1-1-2 继续生成功能**（`case 'continue'` 是 TODO，需要 `generateRequest` 实现）
  - [ ] 调用 `continueGenerate` API（待添加）
  - [ ] 失败/重试处理
- [ ] **1-1-3 重说（重试）选内容**（已有 UI，但需要后端配合返回多个候选）
  - [ ] 完善 `handleRetry` 调用 `retellMessage` 流式
  - [ ] 支持多个候选让用户选
- [ ] **1-1-4 消息错误状态**（Chat.vue 没有处理 `error: true` 的消息）
- [ ] **1-1-5 智能按钮群**（重说/继续/复制/播放）
  - [ ] "播放"功能（TTS 播放角色消息）
  - [ ] 自动播放开关（`autoPlayAudio` 持久化）
  - [ ] "如果不知道回什么" 引导提示（首次显示，可关闭持久化）

#### 1.2 蒙版/操作
- [ ] **1-2-1 用户消息的蒙版**（已有，但需要补"撤回/编辑"操作）
- [ ] **1-2-2 自由复制**（已有 `freeCopyVisible` 但未真正实现点击复制）
- [ ] **1-2-3 文本选择/long-press 调起选择菜单**（H5 可用 `getSelection`）

#### 1.3 背景与样式
- [ ] **1-3-1 背景图选择 sheet**（小程序有 `background-sheet` 组件）
  - [ ] 新建 `components/common/BackgroundSheet.vue`
  - [ ] 持久化到 localStorage
- [ ] **1-3-2 始终全屏（沉浸模式）**（小程序有 `alwaysFullScreen` 开关）
- [ ] **1-3-3 微信客服按钮**（小程序 `wx.openCustomerServiceChat`）

#### 1.4 输入框（`InputBox.vue`）
- [ ] **1-4-1 文本优化器**（小程序有 `text-optimizer` 组件）
  - [ ] 新建 `components/common/TextOptimizer.vue`
  - [ ] 接入"AI 优化你的输入" 按钮
- [ ] **1-4-2 语音输入**（小程序有 WechatSI 语音识别插件，H5 需用 Web Speech API）
- [ ] **1-4-3 图片上传**
  - [ ] 拍照/相册选择（H5 用 `<input type="file" capture>`）
  - [ ] 图片裁剪页（小程序 `common/cropper`）
- [ ] **1-4-4 长按说话**（H5 用 Web Speech + MediaRecorder）

#### 1.5 剧情相关
- [ ] **1-5-1 forkPlotFromMessage（新剧情从某个消息分叉）**（API 已声明但 Chat.vue 未实现 `onButtonClick('newPlot')` 调 `forkPlotFromMessage`）
- [ ] **1-5-2 剧情世界观设定**（已有 `SceneDialog`，但要扩展）
- [ ] **1-5-3 记忆 summary 显示**（小程序 `memory-display`、`memory-sheet`）
  - [ ] 当前剧情的 AI 自动记忆汇总
- [ ] **1-5-4 群聊模式下"speaker 切换"UI**（多角色发言）

---

### 模块 2：群聊（`pages/group`）👥

> **现状**：路由已注册，但大部分页面文件不存在或为空。

- [ ] **2-1 创建群聊**（`/pages/group/add/Index.vue`）
  - [ ] 表单：群名、头像、简介、标签
  - [ ] 选择角色（跳转 `/pages/group/role-select/Index.vue`）
  - [ ] 角色设定页（如果有）
- [ ] **2-2 群聊详情**（`/pages/group/detail/Index.vue`）
  - [ ] 群成员列表
  - [ ] 群公告
  - [ ] 编辑群信息
- [ ] **2-3 群聊主页**（`/pages/group/chat/Index.vue`）
  - [ ] 引入 `GroupChat.vue`（已有骨架）
  - [ ] 多角色发言切换
- [ ] **2-4 群聊剧情**（`/pages/group/plot/Index.vue` + `story/Index.vue`）
- [ ] **2-5 群聊 API 补全**
  - [ ] `createGroupChat`、`updateGroupChat`
  - [ ] `uploadGroupAvatar`
  - [ ] `kickMember`、`inviteMember`

---

### 模块 3：角色管理（`pages/role`）🎭

> **现状**：路由 + 多数 vue 文件存在，但很多是空壳。

- [ ] **3-1 创建/编辑角色**（`/pages/role/add/Index.vue`）
  - [ ] 表单：头像/名称/简介/标签/类型
  - [ ] 高级设定（开场白、记忆、剧情）
  - [ ] 调用 `createCharacter` / `updateCharacter`
- [ ] **3-2 角色设定**（`/pages/role/add/role-setting/Index.vue`）
- [ ] **3-3 我的设定（persona）**（`/pages/role/my-setting/Index.vue`）
  - [ ] 默认 persona 编辑
  - [ ] 调用 `createPersona` / `updatePersona`
- [ ] **3-4 聊天设置**（`/pages/role/chat-setting/Index.vue`）
- [ ] **3-5 聊天风格**（`/pages/role/chat-style/Index.vue` + `add/Index.vue`）
  - [ ] 风格列表（`getChatStyleList`）
  - [ ] 创建/编辑/删除
- [ ] **3-6 音色列表/选择**（`/pages/role/voice-list/Index.vue`）
  - [ ] 调用 `getVoiceList` / `setCharacterVoice`
  - [ ] 试听/收藏音色
- [ ] **3-7 词库（world-book）**（`/pages/role/world-book/Index.vue` + `world-book-edit/Index.vue`）
  - [ ] 词条列表、增删改查
- [ ] **3-8 剧情（plot）**（`/pages/role/plot/Index.vue`）
  - [ ] 该角色的剧情列表
  - [ ] 切换/删除剧情

#### 角色详情 (`pages/role/role-detail`)
- [ ] **3-9 角色详情页**（已有 `Index.vue`，但功能可能不全）
  - [ ] 关注作者 (`followUser` / `unfollowUser` 已有 API)
  - [ ] 分享角色
  - [ ] 进入聊天

---

### 模块 4：发现页（`pages/discover`）🔍

> **现状**：Discover.vue 已实现大部分功能但有一些遗漏点。

- [ ] **4-1 搜索**（`/pages/discover/search/Index.vue`）
  - [ ] 热门搜索词（`getHotSearchKeywords` 已有）
  - [ ] 搜索历史
  - [ ] 实时搜索结果
- [ ] **4-2 排行榜**（`/pages/discover/rank/Index.vue`）
  - [ ] 调用 `getCharacterRanking`
  - [ ] 多维度（热度/收藏/最新）
- [ ] **4-3 折扣/活动弹窗**（Discover.vue 已有但功能不完整）
  - [ ] `gemini_activity` 弹窗点击切换模型
  - [ ] 邀请活动（activeMark=6）流程

---

### 模块 5：首页（`pages/home`）🏠

> **现状**：Home.vue 是占位，需要整合。

- [ ] **5-1 首页聊天集成**（Home.vue 用了 `ChatPlaceholder`，但需要真实接入 Chat.vue）
- [ ] **5-2 邀请码流程**
  - [ ] `?isInvite=true&inviteCode=xxx` 参数解析
  - [ ] 跳转 usercenter 后填邀请码
- [ ] **5-3 活动弹窗**（`activity-dialog`、`richtext-dialog`）
  - [ ] `activeMark=3` 创作者激励
  - [ ] `activeMark=6` 邀请奖励
  - [ ] `activeMark=其他` 通知公告
- [ ] **5-4 wxCode 客服微信号复制**（小程序有）

---

### 模块 6：个人中心（`pages/usercenter`）👤

> **现状**：UserCenter.vue 已实现大部分，但 `roleList` 是写死的 mock 数据。

- [ ] **6-1 真实数据接入**
  - [ ] 替换 mock 的 roleList 为 `getCharacterList({ ifSystem: false, type: 'private/public' })`
  - [ ] 应用群聊 tab 切换
- [ ] **6-2 邀请码功能完整化**（UserCenter.vue 的 `onInviteCodeClick` 是个 dialog）
  - [ ] 新建 `dialogs/InviteCodeDialog.vue`（参考小程序同名组件）
  - [ ] 弹窗输入邀请码 → `redeemInviteCode` → `rechargeResultDialog` 提示
- [ ] **6-3 邀请好友/分享**（已有 `pages/share`，需要 check）
- [ ] **6-4 ActionSheet 真实实现**（目前是简陋的 showDialog）
  - [ ] 新建 `dialogs/ActionSheet.vue`
  - [ ] 支持 4 种操作根据 publishStatus 显示
- [ ] **6-5 编辑资料**（`pages/usercenter/edit/Index.vue`）
  - [ ] 修改昵称/头像/简介
  - [ ] 调用 `updateUserInfo`
- [ ] **6-6 注销账号**（已声明 `logoff()` API 但 UI 未接）

---

### 模块 7：VIP 模块（`pages/vip`）💎

> **现状**：路由已注册，但 api/vip 只有 3 个接口，UI 几乎全部未实现。

- [ ] **7-1 套餐选择**（`/pages/vip/packages/Index.vue`）
  - [ ] 调用 `getVipPackages`（API 缺失，需要后端接口）
  - [ ] 套餐卡片展示
  - [ ] 选择 → 进入订单确认
- [ ] **7-2 订单确认**（`/pages/vip/order-confirm/Index.vue`）
  - [ ] 微信 H5 支付集成
- [ ] **7-3 支付状态**（`/pages/vip/payment-status/Index.vue`）
  - [ ] 轮询支付结果
- [ ] **7-4 次数明细**（`/pages/vip/times-detail/Index.vue`）
  - [ ] 调用 `getMyPointDetails`
- [ ] **7-5 VIP API 补全**
  - [ ] `getVipPackages`（套餐列表）
  - [ ] `createVipOrder`
  - [ ] `payVipOrder`（对接 H5 微信支付）
  - [ ] `cancelVipOrder`

---

### 模块 8：积分（`pages/points`）⭐

- [ ] **8-1 积分首页**（`/pages/points/Index.vue`）
  - [ ] 积分余额、获取方式
  - [ ] 充值 dialog（已有 `PointsRechargeDialog.vue`）
- [ ] **8-2 积分明细**（`/pages/points/detail/Index.vue`）
  - [ ] 调用 `getMyPointDetails`
- [ ] **8-3 角色积分明细**（`/pages/points/role-detail/Index.vue`）
  - [ ] 调用 `getCharacterPointDetail`

---

### 模块 9：内容发布（`pages/contentadd`）📝

> **现状**：路由+几个空目录。

- [ ] **9-1 内容发布主页**（`/pages/contentadd/Index.vue`）
  - [ ] 选择"写博客"或"其他"
- [ ] **9-2 博客编辑**（`/pages/contentadd/blog/Index.vue`）
- [ ] **9-3 主题选择**（`/pages/contentadd/theme/Index.vue`）
- [ ] **9-4 风格选择**（`/pages/contentadd/style/Index.vue`）

---

### 模块 10：分享（`pages/share`）🔗

- [ ] **10-1 分享海报**（`/pages/share/Index.vue`）
  - [ ] `dom-to-image` / `html2canvas` 生成海报
  - [ ] 长按保存图片（H5 用 `<a download>`）
  - [ ] 分享到朋友圈引导
- [ ] **10-2 分享记录**（`/pages/share/record/Index.vue`）
  - [ ] 调用 `getShareRecord`
  - [ ] 邀请人数/奖励积分

---

### 模块 11：通用（`pages/common`）🔧

- [ ] **11-1 关于我们**（`/pages/common/aboutus/Index.vue`）
- [ ] **11-2 用户协议**（`/pages/common/agreement/Index.vue`）
  - [ ] 调用 `getAgreement(agreementType)`
- [ ] **11-3 图片裁剪**（`/pages/common/cropper/Index.vue`）
  - [ ] 用 `cropperjs` 实现
- [ ] **11-4 图片生成**（`/pages/common/pic-generate/Index.vue` + `result/Index.vue`）
  - [ ] AI 生成图片（接口未知）
- [ ] **11-5 意见反馈**（`/pages/common/feedback/Index.vue`）
  - [ ] 调用 `submitFeedback`（API 缺失）

---

### 模块 12：商城 + 订单（`pages/goods`、`pages/order`）🛒

> **现状**：小程序完整商城模块，H5 **完全空缺**。

- [ ] **12-1 商品列表**（`/pages/goods/list/Index.vue`）
  - [ ] 调用 `fetchGoodsList`
  - [ ] 分类切换（`fetchCategoryList`）
- [ ] **12-2 商品详情**（`/pages/goods/details/Index.vue`）
- [ ] **12-3 商品搜索**（`/pages/goods/search/Index.vue` + `result/Index.vue`）
  - [ ] `fetchSearchHistory`、`fetchSearchResult`
- [ ] **12-4 商品评论**
  - [ ] 列表 (`/pages/goods/comments/Index.vue`)
  - [ ] 发布 (`/pages/goods/comments/create/Index.vue`)
- [ ] **12-5 我的订单**（`/pages/order/myOrders/Index.vue`）
  - [ ] 调用 `getMyOrders`
- [ ] **12-6 H5 商城 API 全套补全**
  - [ ] `fetchCategoryList` / `fetchGoods` / `fetchGoodsList`
  - [ ] `fetchGoodsDetailsComments`
  - [ ] `createOrder` / `payOrder` / `cancelOrder`
  - [ ] `submitGoodsComment`

---

### 模块 13：锁屏（`pages/lock`）🔒

- [ ] **13-1 锁屏**（`/pages/lock/Index.vue`）
  - [ ] 手势解锁/密码解锁
- [ ] **13-2 设置锁屏**（`/pages/lock/set/Index.vue`）
  - [ ] 设置密码/手势

---

### 模块 14：星耀集（`pages/star-yao-ji`）🏆

- [ ] **14-1 我的收益概览**（`/pages/star-yao-ji/Index.vue`）
  - [ ] 调用 `getMyIncomeOverview`、`getMyAchievements`
  - [ ] 收益明细页（参数 ?type=overview/details）
- [ ] **14-2 收益明细**（需要二级页）

---

### 模块 15：缺失的 API 集中补全 📡

| 缺失 API | 涉及小程序文件 | 状态 |
|---|---|---|
| `ttsMessage`、`getVoiceList` | `services/tts/index.js` | ❌ 需新增 `api/tts/index.js` |
| `fetchFilePresignedUrl` | `services/file/index.js` | ❌ 需新增 `api/file/index.js` |
| `getVipPackages`、`payVipOrder` | `services/vip/index.js` | ❌ 接口不存在 |
| `fetchGoodsList`、`createOrder` | `services/good/*` | ❌ 全套缺失 |
| `submitFeedback` | `services/feedback/` | ❌ |
| `wx.scanCode` 等能力 | `wx-adapter.js` | ❌ |

---

### 模块 16：缺失/不完整的组件 🧩

> 对照小程序 30+ 组件，目前仅有 9 个顶层 + 子目录里 7+3+6=16 个，仍有不少缺失。

- [ ] **16-1** `activity-dialog`（创作者/邀请活动）
- [ ] **16-2** `background-sheet`（背景图选择）
- [ ] **16-3** `common-dialog-content`（通用对话框内容）
- [ ] **16-4** `custom-rate`（评分）
- [ ] **16-5** `filter` / `filter-popup`（筛选）
- [ ] **16-6** `image-uploader` / `uploader`（上传）
- [ ] **16-7** `invite-code-dialog`（邀请码 dialog）
- [ ] **16-8** `load-more` / `loading-content`（加载）
- [ ] **16-9** `logoff-dialog`（注销）
- [ ] **16-10** `optimize-btn`、`text-optimizer`（文本优化）
- [ ] **16-11** `price`（价格显示）
- [ ] **16-12** `richtext-dialog`（富文本弹窗）
- [ ] **16-13** `share-dialog`（分享）
- [ ] **16-14** `swipeout`（滑动操作）
- [ ] **16-15** `tip-dialog` 完整化（已有但需丰富）
- [ ] **16-16** `webp-image`（webp 兼容）
- [ ] **16-17** `contact-service-dialog`（客服 dialog）
- [ ] **16-18** `points-recharge-dialog`（已有，需 check）
- [ ] **16-19** `recharge-result-dialog`（充值结果）
- [ ] **16-20** `memory-desc-overlay`（记忆描述蒙版）

---

### 模块 17：缺失的工具/能力 🔌

- [ ] **17-1 `decodeArrayBuffer`**（mp3 解码）
- [ ] **17-2 `msgHandler` 完整化**（小程序中 14KB 的 Markdown / 消息格式化）
  - [ ] 把 `utils/msgHandler.js` 完整迁移
  - [ ] `formatMessage`、`parseEmoji`、`replaceThinkTag` 等
- [ ] **17-3 `mock`**（mock 数据生成器）
- [ ] **17-4 表情包解析**（emoji 转图片）

---

### 模块 18：测试与质量保障 🧪

- [ ] **18-1 vitest 单元测试**（`vitest.config.js` 已配，缺测试用例）
- [ ] **18-2 Playwright e2e**（`playwright.config.js` 已配，缺测试用例）
- [ ] **18-3 样式像素适配**（rpx 转 vw 已写，但缺各页面适配测试）
- [ ] **18-4 性能监控**（首屏、API 耗时）
- [ ] **18-5 错误上报**（Sentry/自研）

---

## 三、优先级建议（推荐实施顺序）

### P0 - 上线必备（必须实现）
1. **模块 0-1 / 0-2**：微信登录 + 分享（否则 H5 在微信里没法用）
2. **模块 1.1 全部**：聊天核心功能（用户消息流）
3. **模块 6.1**：UserCenter 接入真实数据
4. **模块 7 全部**：VIP（业务核心）
5. **模块 12**：商城（业务核心）

### P1 - 体验优化
6. **模块 1.2 ~ 1.5**：聊天蒙版/背景/输入优化
7. **模块 1.4**：文本优化、语音输入
8. **模块 3**：角色管理全流程
9. **模块 11**：通用页（反馈/协议）
10. **模块 0-3**：wx-adapter 适配层

### P2 - 锦上添花
11. **模块 2**：群聊完整功能
12. **模块 13**：锁屏
13. **模块 14**：星耀集
14. **模块 16/17**：组件库/工具补全
15. **模块 18**：测试

---

## 四、缺失统计概览

- **缺失页面（vue 文件未实现）**：约 30 个
- **缺失 API**：约 15 个接口
- **缺失组件**：约 18 个
- **TODO 占位逻辑**：chat / UserCenter 中约 20 处
- **小程序私有能力待迁移**：约 10 个（扫码/录音/同声传译/客服等）

---

## 五、附：H5 已完成但需要打磨的部分

> 这些页面已有 Vue 文件，但功能可能需要联调/优化：

- ✅ `views/chat-list/ChatList.vue`（会话列表）
- ✅ `views/discover/Discover.vue`（基础可用）
- ✅ `views/discover/rank`（路由已注册，需检查实现）
- ✅ `views/discover/search`（路由已注册，需检查实现）
- ✅ `views/role/role-detail/Index.vue`（276 行）
- ✅ `views/usercenter/UserCenter.vue`（324 行，需要将 mock 替换为真实数据）
- ✅ `views/star-yao-ji/Index.vue`（167 行）
- ✅ `views/lock/Index.vue`（136 行）
- ✅ `components/chat/Chat.vue`（279 行基础版）
- ✅ `components/dialogs/*`（8 个 dialog 已写）
- ✅ `components/common/MemorySheet.vue` / `MemoryDisplay.vue`

---

**最后更新**：2026-09-28 18:12  
**负责人**：（请指派）  
**预计总工作量**：约 **40-60 人日**（按中等水平工程师）
