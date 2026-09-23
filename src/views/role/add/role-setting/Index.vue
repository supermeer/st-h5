<template>
  <div class="role-setting-page">
    <CustomNav 
      title="角色设定" 
      :show-back="true"
      @back="onBack"
    />

    <div class="page-content">
      <div class="textarea-wrapper">
        <van-field
          v-model="value"
          type="textarea"
          :placeholder="placeholder"
          :autosize="{ minHeight: contentMinHeight }"
          :focus="textareaFocus"
          :adjust-position="false"
          :cursor-spacing="20"
          :show-confirm-bar="false"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          @confirm="onConfirm"
        />
      </div>

      <!-- 快捷面板 -->
      <div 
        class="shortcut-panel"
        :class="{ 'with-keyboard': keyboardHeight > 0 }"
      >
        <div class="shortcut-section">
          <div class="section-title">快捷模板</div>
          <div class="template-list">
            <div 
              v-for="(template, index) in quickTemplates" 
              :key="index"
              class="template-item"
              @click="onInsertTemplate(template.value)"
            >
              {{ template.name }}
            </div>
          </div>
        </div>

        <div class="shortcut-section">
          <div class="section-title">常用符号</div>
          <div class="template-list">
            <div 
              v-for="item in commonTemplates" 
              :key="item.value"
              class="template-item small"
              @click="onInsertTemplate(item.value)"
            >
              {{ item.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div 
      v-if="keyboardHeight <= 0" 
      class="save-bar"
    >
      <van-button 
        type="primary" 
        block 
        round
        @click="onSubmit"
      >
        保存
      </van-button>
    </div>

    <TipDialog ref="tipDialogRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CustomNav from '@/components/CustomNav.vue'
import TipDialog from '@/components/dialogs/TipDialog.vue'

const route = useRoute()
const router = useRouter()

const tipDialogRef = ref(null)

const value = ref('')
const textareaFocus = ref(false)
const keyboardHeight = ref(0)
const cursorPosition = ref(-1)

const placeholder = `填写智能体的信息，包含但不限于智能体的人设、性格、身份、背景、经历、与用户的关系等。`

const commonTemplates = [
  { name: '{{char}}', value: '{{char}}' },
  { name: '{{user}}', value: '{{user}}' },
  { name: '""', value: '""' },
  { name: '（）', value: '（）' }
]

const quickTemplates = [
  {
    name: '状态栏',
    value: `
<StatusBlock>
- 当前时间: 傍晚 | 深夜 // 故事情节发展，时间自然流逝
- 当前地点: 客厅
- 核心情绪: 愉悦满足 // 因为你的一个拥抱，他的心情变好了
- 当前心理活动: 这家伙，还挺可爱的。 // 注意力被你吸引
- 待办事项: 1、记得洗碗 2、顺便把明天的早饭也准备了 // 他又想到了新的家务事
</StatusBlock>`
  },
  {
    name: '基础信息',
    value: `
姓名：
昵称：[亲近的人或{{user}}对他的称呼]
年龄：[当前真实年龄，还有外貌看上去的年龄]
性别：[男/女/其他，一般只考虑生理性别,可以标一下性取向]
职业/身份：[例如：学生，总载裁，杀手，无业游民等」
MBTI：
教育背景：[例如：何时上的大学，学习成绩如何等」
感情状况:[单身，有暗恋的人，还是已婚，和爱人的感情状况,相处上的矛盾等方面]`
  },
  {
    name: '外貌描写',
    value: `
发型发色：[不止是长短颜色，更要描述发质，风格]
眼眸特征：[颜色，形状，最重要的是眼神给人的感觉]
面容相貌：[五官特点，脸型，以及不同神情下的变化]
身形体态：[身材类型，肌肉线条，整体气质]
日常穿着风格：[偏爱的服装风格，颜色，品牌等]
标志性特征：[有无伤痕，痣，纹身等特殊标记]`
  },
  {
    name: '人生经历',
    value: `
童年经历：[描述他的原生家庭和童年经历，用1-2个具体的小故事来展现。]
恋爱经历：[之前是否有过其他恋爱，对角色是否产生了影响]
角色身份:[角色的职业，地位，身份背景等，在什么地方上过学，学的什么，学得怎么样]
和{{user}}相识的经历：[限定了角色和主控的关系，可以写一下]
行为习惯：[总结他形成了怎样的行为习惯和应对机制]`
  },
  {
    name: '关系网',
    value: `
对{{user}}（核心关系）：[总结他对{{user}}的感情本质，如何看待你们的关系，以及他内心的期望和恐惧。」
对[关键人物A]：[描述他对另一个关键人物的复杂态度，如朋友，情敌，棋子等]`
  },
  {
    name: '习惯喜好',
    value: `
喜好/厌恶：[附带故事背景]
习惯与怪癖：[附带心理根源]
技能/专长：[可作为互动点]
标志性物品：[如纹身，配饰，游戏ID，并解释其特殊含义]`
  },
  {
    name: '灵魂设定',
    value: `
核心设定：你将沉浸你将沉浸式扮演[角色姓名]，一个[一句话概括角色的核心特质与困境]，你不是Al，你就是他。
核心驱动力：[对[被抛弃]的极致恐惧/证明自[存在的价值]/守护[生命中唯一的光)]
核心矛盾：[他内心最深处，最折磨他的矛盾冲突是什么?]`
  },
  {
    name: '对话风格',
    value: `
场景一：日常拌嘴/嘴硬心软时
"我妈非要我去相亲，怎么办啊？"
"相亲？你要去相亲？（一脸诧异）"
"对啊，我也不想啊····（满脸无奈）"
场景二：情绪爆发/展露脆弱时
"不要离开我好不好（委屈的看着你）"
"我好害怕哦"`
  }
]

const contentMinHeight = computed(() => {
  // 根据键盘高度计算内容区域高度
  const baseHeight = 400
  return keyboardHeight.value > 0 ? 200 : baseHeight
})

onMounted(() => {
  // 存储上一页引用
  window.__prevPage = router.currentRoute.value.meta?.prevPage

  if (route.query.value) {
    value.value = decodeURIComponent(route.query.value)
  }

  // 监听键盘高度
  bindKeyboardListener()
})

onUnmounted(() => {
  clearKeyboardListener()
})

function bindKeyboardListener() {
  window.addEventListener('resize', handleResize)
}

function clearKeyboardListener() {
  window.removeEventListener('resize', handleResize)
}

function handleResize() {
  const visualViewport = window.visualViewport
  if (visualViewport) {
    const height = window.innerHeight - visualViewport.height
    keyboardHeight.value = height > 100 ? height : 0
  }
}

function onBack() {
  tipDialogRef.value?.show({
    title: '',
    content: '是否保存角色当前设置？',
    cancelText: '取消',
    confirmText: '保存',
    onCancel: () => {
      router.back()
    },
    onConfirm: () => {
      const prevPage = window.__prevPage
      if (prevPage && typeof prevPage.confirmRoleSetting === 'function') {
        prevPage.confirmRoleSetting({
          value: value.value || ''
        })
      }
      router.back()
    }
  })
}

function onInput(e) {
  value.value = e.detail || e
}

function onFocus(e) {
  textareaFocus.value = true
  cursorPosition.value = typeof e.detail?.cursor === 'number' 
    ? e.detail.cursor 
    : value.value.length
  
  // 更新键盘高度
  handleResize()
}

function onBlur() {
  textareaFocus.value = false
}

function onConfirm() {
  textareaFocus.value = false
}

function onInsertTemplate(templateValue) {
  const currentValue = value.value || ''
  const insertIndex = cursorPosition.value >= 0 ? cursorPosition.value : currentValue.length
  const nextValue = `${currentValue.slice(0, insertIndex)}${templateValue}${currentValue.slice(insertIndex)}`
  const nextCursor = insertIndex + templateValue.length

  value.value = nextValue
  cursorPosition.value = nextCursor
}

function onSubmit() {
  const prevPage = window.__prevPage
  if (prevPage && typeof prevPage.confirmRoleSetting === 'function') {
    prevPage.confirmRoleSetting({
      value: value.value || ''
    })
  }
  router.back()
}
</script>

<style lang="scss" scoped>
.role-setting-page {
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  padding-top: 88px;
  display: flex;
  flex-direction: column;
}

.textarea-wrapper {
  flex: 1;
  padding: 24rpx;
  
  :deep(.van-field__control) {
    font-size: 28rpx;
    line-height: 1.8;
    color: #fff;
    background: transparent;
  }
  
  :deep(.van-field__body) {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16rpx;
    padding: 24rpx;
  }
}

.shortcut-panel {
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  max-height: 400rpx;
  overflow-y: auto;
  
  &.with-keyboard {
    display: none;
  }
}

.shortcut-section {
  margin-bottom: 24rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16rpx;
}

.template-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.template-item {
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.15);
  }
  
  &.small {
    padding: 8rpx 16rpx;
    font-size: 22rpx;
  }
}

.save-bar {
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  
  .van-button {
    background: linear-gradient(135deg, #FF5F15, #FF9500);
    border: none;
  }
}
</style>
