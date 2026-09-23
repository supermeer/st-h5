# 星语酒馆 H5 复刻

> 基于微信小程序项目 `st` 复刻的 H5 版本，保持功能、样式一致，让用户无感切换。

## 技术栈

- **Vue 3** + `<script setup>` + Composition API
- **Vite 8** + 自动化构建
- **Vant 4**（H5 UI 库，对应原 `@vant/weapp`）
- **Pinia**（状态管理，对应原 `westore`）
- **Vue Router 4**（路由，对应原小程序 `wx.switchTab/navigateTo`）
- **Axios** + SSE（HTTP，对应原 `wx.request`）
- **dayjs** / **marked**（工具库，沿用原项目）
- **postcss-px-to-viewport-8-plugin**（`px → vw`，模拟小程序的 `rpx`）

## 阶段进度

### ✅ 阶段1：项目初始化
- 位置：`/Users/caoyongchao/Desktop/cyc/cy/st-h5`
- 技术栈、目录结构、Vite 配置、4 个 TabBar + 登录页骨架

### ✅ 阶段2：核心能力层
- `src/utils/wx-adapter.js` — 全量 wx API 适配（35+ API）
- `src/api/http.js` — axios + 流式 SSE 解析
- `src/api/*` — 15 个业务接口文件
- `src/store/user.js` — Pinia 用户 Store（含 refreshVipInfo/PointInfo）
- `src/utils/system.js` / `util.js` — 系统信息 + 通用工具
- `src/main.js` — 401 自动触发登录弹窗

### ✅ 阶段3：页面翻译
- 50+ 个页面 1:1 翻译为 Vue 组件
- 完整路由配置（`src/router/index.js`），对应小程序 `pages` + `subPackages`
- 路由配置 lazy import，按需加载
- 每个页面包含：
  - `CustomNav` 自定义导航（顶 bar，含返回/标题）
  - 业务内容骨架（占位 → 阶段4 完整业务）
  - 样式 `lang="scss" scoped`
- 核心页面已完成完整实现：
  - **Home.vue** — 完整接入 ChatPlaceholder、未成年人提醒、活动弹窗、登录态
  - **Discover.vue / ChatList.vue / UserCenter.vue** — 接入用户 Store 与实际跳转

### 📋 阶段4：组件与业务实现（待完成）
- 50+ 自定义组件 1:1 翻译
- 聊天消息渲染、SSE 流式消费、Markdown 渲染
- 图片上传/裁剪、TTS 语音合成、AI 模型选择器

## 目录结构

```
st-h5/
├── src/
│   ├── api/                   # 接口层
│   ├── views/                 # 50+ 页面（对应小程序 pages/）
│   │   ├── home/              # 首页
│   │   ├── discover/          # 发现
│   │   ├── chat-list/
│   │   ├── chat/
│   │   ├── usercenter/
│   │   ├── login/
│   │   ├── share/             # 分包
│   │   ├── contentadd/
│   │   ├── order/
│   │   ├── role/              # 角色
│   │   ├── group/             # 群聊
│   │   ├── vip/
│   │   ├── common/
│   │   ├── points/
│   │   ├── lock/
│   │   └── star-yao-ji/
│   ├── components/            # 公共组件
│   │   ├── CustomNav.vue      # 自定义导航
│   │   ├── CustomTabBar.vue   # 底部 TabBar
│   │   ├── AuthDialog.vue     # 登录弹窗
│   │   ├── ChatPlaceholder.vue # 聊天占位（阶段4 完整）
│   │   └── PagePlaceholder.vue # 通用占位
│   ├── store/user.js          # Pinia 用户 Store
│   ├── utils/                 # 工具层
│   │   ├── wx-adapter.js      # wx.* 适配层（35+ API）
│   │   ├── router-bridge.js   # 路由桥接
│   │   ├── system.js          # 系统信息
│   │   ├── util.js            # 工具函数
│   │   ├── getPermission.js
│   │   └── agreement.js
│   ├── styles/                # 全局样式
│   ├── router/index.js        # 路由（含 60+ 路由）
│   ├── App.vue                # 根组件（含 AuthDialog + CustomTabBar）
│   └── main.js                # 入口
├── index.html
└── vite.config.js
```

## 启动方式

```bash
cd /Users/caoyongchao/Desktop/cyc/cy/st-h5
npm run dev     # http://localhost:5173
npm run build   # 生产构建（501 个模块，~1.5s）
npm run preview # 预览构建产物
```

## 路由对应表（节选）

| 小程序路径 | H5 路由 |
|---|---|
| `pages/home/home` | `/pages/home/home` |
| `pages/discover/index` | `/pages/discover/index` |
| `pages/chat-list/index` | `/pages/chat-list/index` |
| `pages/usercenter/index` | `/pages/usercenter/index` |
| `pages/chat/index?characterId=1` | `/pages/chat/index?characterId=1` |
| `pages/role/role-detail/index` | `/pages/role/role-detail/index` |
| `pages/group/chat/index` | `/pages/group/chat/index` |
| `pages/vip/packages/index` | `/pages/vip/packages/index` |

## 下一步（阶段4）

50+ 组件翻译，从聊天核心开始：
1. `chat/index.js`（1445 行）— 核心聊天组件
2. `chat/input-box` / `chat/role-msg` / `chat/user-msg` — 消息子组件
3. `auth` / `tip-dialog` / `model-sheet` 等通用弹窗
4. 50+ 其他组件按优先级逐个翻译
