<template>
  <div class="page-placeholder">
    <van-empty :description="description">
      <template v-if="$slots.default" #default>
        <slot />
      </template>
    </van-empty>
  </div>
</template>

<script setup>
defineProps({
  description: { type: String, default: '页面占位（阶段3）' }
})
</script>

<style lang="scss" scoped>
.page-placeholder {
  padding: 48px 16px;
}
</style>
