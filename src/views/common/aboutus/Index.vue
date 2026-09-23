<template>
  <div class="aboutus-container">
    <CustomNav :title="''" :show-back="true" :show-home="false" />

    <div class="aboutus-content">
      <div
        v-for="(item, index) in itemList"
        :key="index"
        :class="item.header ? 'aboutus-header' : 'aboutus-item blur-glass'"
        @click="onItemClick(item, index)"
      >
        <template v-if="item.header">
          <div class="header-text">{{ item.title }}</div>
        </template>
        <template v-else>
          <div class="aboutus-item-left">
            <div class="aboutus-item-title">
              {{ item.title }}
              <span v-if="item.showNew" class="aboutus-item-new">new</span>
            </div>
            <div v-if="item.desc" class="aboutus-item-desc">{{ item.desc }}</div>
          </div>
          <span v-if="item.showDot" class="aboutus-item-dot"></span>
          <template v-if="item.isGradientPicker">
            <span class="aboutus-item-arr">
              <van-icon name="arrow" color="#999" size="14" />
            </span>
          </template>
          <template v-else-if="item.isThemePicker">
            <span class="aboutus-item-arr">
              <van-icon name="arrow" color="#999" size="14" />
            </span>
          </template>
          <template v-else-if="item.isSwitch">
            <van-switch
              :model-value="item.switchOptions.checked"
              active-color="#8B5CF6"
              inactive-color="rgba(255,255,255,0.15)"
              @update:model-value="(val) => onSwitchChange(index, val)"
              @click.stop
            />
          </template>
          <template v-else-if="item.url">
            <span class="aboutus-item-arr">
              <van-icon name="arrow" color="#999" size="14" />
            </span>
          </template>
        </template>
      </div>

      <div class="logoff-item" @click="onLogoffClick">
        <div class="logoff-item-title">注销账号</div>
      </div>
    </div>

    <!-- 注销弹窗 -->
    <van-dialog
      v-model:show="showLogoffDialog"
      title="注销账号"
      show-cancel-button
      :before-close="onLogoffBeforeClose"
    >
      <div class="logoff-dialog-content">
        <p>注销账号后将无法恢复，请确认操作</p>
      </div>
    </van-dialog>

    <!-- 模型选择弹窗 -->
    <ModelSheet ref="modelSheetRef" />

    <!-- 主题切换弹窗 -->
    <van-action-sheet
      v-model:show="showThemeSheet"
      title="选择主题"
      :actions="THEME_OPTIONS.map(opt => ({ name: opt.name, subname: themeStore.theme === opt.theme ? '当前' : '' }))"
      cancel-text="取消"
      close-on-click-action
      @select="(action, idx) => onSelectTheme(THEME_OPTIONS[idx].theme)"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import CustomNav from '@/components/CustomNav.vue'
import ModelSheet from '@/components/dialogs/ModelSheet.vue'
import { getModelList, getGlobalModelId } from '@/api/usercenter'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const QUOTE_GRADIENT_OPTIONS = [
  { id: 'gold-cyan', name: '金青渐变' },
  { id: 'pink-purple', name: '粉紫渐变' },
  { id: 'orange-red', name: '橙红渐变' },
  { id: 'blue-purple', name: '蓝紫渐变' }
]

const itemList = ref([
  { header: true, title: '我的' },
  { title: '对话模型', desc: '', isModel: true, showDot: false, url: '/pages/role/my-setting/index?isGlobal=true' },
  {
    title: '全局设定',
    desc: '设置所有智能体对你的称呼',
    url: '/pages/role/my-setting/index?isGlobal=true'
  },
  {
    title: '始终全屏展示对话',
    desc: '',
    url: '',
    isSwitch: true,
    switchOptions: {
      checked: false,
      getChecked: () => localStorage.getItem('alwaysFullScreen') === 'true',
      onChange: (checked) => {
        localStorage.setItem('alwaysFullScreen', checked ? 'true' : 'false')
      }
    }
  },
  {
    title: '自动播放语音',
    desc: '',
    url: '',
    isSwitch: true,
    showNew: false,
    switchOptions: {
      checked: false,
      getChecked: () => localStorage.getItem('autoPlayAudio') === 'true',
      onChange: (checked) => {
        localStorage.setItem('autoPlayAudio', checked ? 'true' : 'false')
      }
    }
  },
  {
    title: '对话字体颜色',
    desc: '',
    url: '',
    isGradientPicker: true,
    getGradientDesc: () => {
      const savedId = localStorage.getItem('quoteGradient') || 'gold-cyan'
      const option = QUOTE_GRADIENT_OPTIONS.find((opt) => opt.id === savedId)
      return option ? option.name : '金青渐变'
    }
  },
  {
    title: '屏幕锁',
    desc: '未开启',
    url: '/pages/lock/set/index'
  },
  {
    title: '外观主题',
    desc: '',
    url: '',
    isThemePicker: true
  },
  {
    title: '意见反馈',
    desc: '',
    url: '/pages/common/feedback/index'
  },
  {
    title: '我的订单',
    desc: '',
    url: '/pages/order/myOrders/index'
  },
  { header: true, title: '关于我们' },
  {
    title: '隐私协议',
    desc: '',
    url: '/pages/common/agreement/index?type=3'
  },
  {
    title: '免责声明',
    desc: '',
    url: '/pages/common/agreement/index?type=2'
  },
  {
    title: '用户协议',
    desc: '',
    url: '/pages/common/agreement/index?type=1'
  },
  {
    title: '版本号',
    desc: '',
    url: ''
  }
])

const currentModel = ref({})
const modelList = ref([])
const showLogoffDialog = ref(false)
const showThemeSheet = ref(false)
const modelSheetRef = ref(null)

const THEME_OPTIONS = [
  { theme: 'light', name: '浅色模式' },
  { theme: 'dark', name: '深色模式' },
  { theme: 'system', name: '跟随系统' }
]

const currentThemeName = computed(() => {
  const found = THEME_OPTIONS.find((opt) => opt.theme === themeStore.theme)
  return found ? found.name : '浅色模式'
})

function updateItemList() {
  const accountInfo = { miniProgram: { version: '2.0.0' } }
  itemList.value = itemList.value.map((item) => {
    const newItem = { ...item }
    if (newItem.title === '版本号') {
      newItem.desc = accountInfo.miniProgram.version
    }
    if (newItem.title === '外观主题') {
      newItem.desc = currentThemeName.value
    }
    if (newItem.isSwitch && newItem.switchOptions?.getChecked) {
      newItem.switchOptions = {
        ...newItem.switchOptions,
        checked: newItem.switchOptions.getChecked()
      }
    }
    if (newItem.isGradientPicker && newItem.getGradientDesc) {
      newItem.desc = newItem.getGradientDesc()
    }
    return newItem
  })
}

function setCurrentModel() {
  if (!currentModel.value || !currentModel.value.id || modelList.value.length === 0) return
  const matched = modelList.value.filter((item) => item.id === currentModel.value.id)
  if (matched && matched.length > 0) {
    updateItemModelName(matched[0].modelName)
    currentModel.value = { ...matched[0] }
  }
}

function updateItemModelName(name) {
  itemList.value[1].desc = name
  itemList.value = [...itemList.value]
}

function updateAutoPlayAudioNewMark(showNew) {
  const idx = itemList.value.findIndex((item) => item.title === '自动播放语音')
  if (idx < 0 || itemList.value[idx].showNew === showNew) return
  itemList.value[idx].showNew = showNew
  itemList.value = [...itemList.value]
}

onMounted(async () => {
  updateItemList()

  if (!localStorage.getItem('newModelMark')) {
    localStorage.setItem('newModelMark', 'true')
    itemList.value[1].showDot = true
    itemList.value = [...itemList.value]
  }
  if (!localStorage.getItem('newAutoPlayAudioMark')) {
    itemList.value[4].showNew = true
    itemList.value = [...itemList.value]
  }
  try {
    const list = await getModelList()
    modelList.value = list || []
    setCurrentModel()
  } catch (e) {
    console.warn('加载模型失败', e)
  }

  // 加载全局模型
  refreshModel()
})

async function refreshModel() {
  try {
    const id = await getGlobalModelId()
    currentModel.value = { ...(currentModel.value || {}), id }
    setCurrentModel()
  } catch (e) {
    console.warn('加载全局模型失败', e)
  }
}

function onItemClick(item, index) {
  if (index === 1) {
    onModelSelect()
    return
  }
  if (item.isGradientPicker) {
    onGradientPicker()
    return
  }
  if (item.isThemePicker) {
    showThemeSheet.value = true
    return
  }
  if (item.url) {
    router.push(item.url)
  }
}

function onSelectTheme(theme) {
  themeStore.setTheme(theme)
  showThemeSheet.value = false
  updateItemList()
  showToast(`已切换为${currentThemeName.value}`)
}

async function onModelSelect() {
  if (!modelSheetRef.value) return
  modelSheetRef.value.show({
    modelOptions: [...modelList.value],
    currentValue: currentModel.value.id,
    onConfirm: (id, item) => {
      updateItemModelName(item.modelName || item.name)
    }
  })
  itemList.value[1].showDot = false
  itemList.value = [...itemList.value]
  localStorage.setItem('newModelMark', 'true')
}

function onSwitchChange(index, value) {
  const item = itemList.value[index]
  if (!item) return
  if (item?.switchOptions?.onChange) {
    item.switchOptions.onChange(value)
    itemList.value[index].switchOptions.checked = value
    itemList.value = [...itemList.value]
    if (item.title === '自动播放语音' && !localStorage.getItem('newAutoPlayAudioMark')) {
      localStorage.setItem('newAutoPlayAudioMark', 'true')
      updateAutoPlayAudioNewMark(false)
    }
  }
}

async function onGradientPicker() {
  try {
    const { showActionSheet } = await import('vant')
    const idx = await showActionSheet({
      title: '选择字体颜色',
      actions: QUOTE_GRADIENT_OPTIONS.map((opt) => ({ name: opt.name }))
    })
    const selected = QUOTE_GRADIENT_OPTIONS[idx]
    if (selected) {
      localStorage.setItem('quoteGradient', selected.id)
      updateItemList()
      showToast(`已切换为${selected.name}`)
    }
  } catch (e) {
    // 用户取消
  }
}

function onLogoffClick() {
  showLogoffDialog.value = true
}

async function onLogoffBeforeClose(action) {
  if (action !== 'confirm') {
    showLogoffDialog.value = false
    return true
  }
  try {
    const { logoff } = await import('@/api/usercenter')
    await logoff()
    showToast('注销成功')
    userStore.clearAuth && userStore.clearAuth()
    setTimeout(() => {
      router.replace('/pages/home/home')
    }, 1000)
  } catch (e) {
    showToast('注销失败，请重试')
  } finally {
    showLogoffDialog.value = false
  }
  return true
}
</script>

<style lang="scss" scoped>
.aboutus-container {
  min-height: 100vh;
  background: #1a1a1a;
  color: #fff;
  padding-top: 88px;
  padding-bottom: 60px;
}

.aboutus-content {
  padding: 0 32px;
}

.aboutus-header {
  padding: 24px 0 16px;
}

.header-text {
  font-size: 28px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}

.aboutus-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 2px;
  cursor: pointer;
  transition: background 0.2s;

  &:first-of-type {
    border-radius: 16px 16px 0 0;
  }

  &:last-of-type {
    border-radius: 0 0 16px 16px;
    margin-bottom: 16px;
  }
}

.aboutus-item-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.aboutus-item-title {
  font-size: 30px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.aboutus-item-new {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, #FF5F15, #FF9500);
  border-radius: 8px;
  font-size: 20px;
  color: #fff;
}

.aboutus-item-desc {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
}

.aboutus-item-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #FF5F15;
  margin-right: 8px;
  flex-shrink: 0;
}

.aboutus-item-arr {
  flex-shrink: 0;
}

.logoff-item {
  text-align: center;
  padding: 32px;
  margin-top: 32px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  cursor: pointer;
}

.logoff-item-title {
  font-size: 30px;
  color: #FF5F15;
}

.logoff-dialog-content {
  padding: 32px 24px;
  font-size: 28px;
  color: rgba(255, 255, 255, 0.8);
}
</style>
