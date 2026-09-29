<template>
  <van-popup
    :show="visible"
    position="bottom"
    round
    closeable
    close-on-click-overlay
    safe-area-inset-bottom
    @update:show="onUpdateShow"
  >
    <div class="create-select-container">
      <div class="create-select-title">请选择</div>
      <div class="create-options">
        <div
          v-for="item in options"
          :key="item.type"
          class="create-option"
          :class="{ disabled: item.disabled }"
          @click="onSelect(item)"
        >
          <div class="option-info">
            <div class="option-label-row">
              <span class="option-label">{{ item.label }}</span>
              <span v-if="item.isNew" class="new-badge">new</span>
            </div>
            <div class="option-desc">{{ item.description }}</div>
          </div>
          <van-icon name="arrow" size="14" color="#999" />
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  options: {
    type: Array,
    default: () => [
      {
        type: 'character',
        label: '创建角色卡',
        description: '量身打造专属人设，随时随地和心仪角色畅聊互动',
        url: '/pages/role/add/index',
        isNew: false
      },
      {
        type: 'group',
        label: '创建群聊',
        description: '自由拉不同世界观的角色入群，看他们互怼、创建有趣剧情',
        url: '/pages/group/add/index',
        isNew: true
      }
    ]
  }
})
const emit = defineEmits(['update:visible', 'select'])

function onUpdateShow(val) {
  emit('update:visible', val)
}

function onSelect(item) {
  if (item.disabled) return
  emit('select', item)
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.create-select-container {
  padding: 32px 32px calc(var(--safearea-bottom) + 32px);
  background: #1f1f28;
  border-radius: 24px 24px 0 0;
  color: #fff;
}

.create-select-title {
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
  color: #fff;
}

.create-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.create-option {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: transform 0.15s;

  &:active {
    transform: scale(0.98);
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.option-info {
  flex: 1;
  min-width: 0;
  margin-right: 16px;
}

.option-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.option-label {
  font-size: 30px;
  font-weight: 600;
  color: #fff;
}

.new-badge {
  font-size: 20px;
  font-weight: 700;
  color: #174DFF;
  background: rgba(23, 77, 255, 0.15);
  border-radius: 8px;
  padding: 2px 8px;
}

.option-desc {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}
</style>
