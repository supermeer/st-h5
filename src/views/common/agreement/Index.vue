<template>
  <div class="agreement-page">
    <CustomNav :title="title" :show-back="true" :show-home="false" :transparent="true" />

    <div v-if="!loading" class="agreement-content" v-html="agreementContent"></div>

    <div v-else class="loading-state">
      <van-loading type="spinner" size="32" color="#FF5F15">加载中...</van-loading>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import CustomNav from '@/components/CustomNav.vue'
import { getAgreementContent } from '@/api/agreement/agreement'

const route = useRoute()

const agreementContent = ref('')
const title = ref('服务协议')
const loading = ref(true)

const typeNameMap = {
  1: '会员服务协议',
  2: '免责声明',
  3: '隐私政策',
  4: '小程序隐私保护指引'
}

onMounted(() => {
  const type = String(route.query.type || 1)
  title.value = typeNameMap[type] || '服务协议'
  loadAgreement(type)
})

async function loadAgreement(type) {
  loading.value = true
  try {
    const res = await getAgreementContent(type)
    if (res && res.content) {
      agreementContent.value = res.content
    }
  } catch (err) {
    console.error('加载协议失败:', err)
    agreementContent.value = '<p>协议加载失败，请稍后重试</p>'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.agreement-page {
  min-height: 100vh;
  background: #1a1a1a;
  color: #fff;
  padding-top: 88px;
}

.agreement-content {
  padding: 24px 32px 60px;
  font-size: 28px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);

  :deep(p) {
    margin-bottom: 20px;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    color: #fff;
    margin: 32px 0 16px;
    font-weight: 600;
  }

  :deep(h1) {
    font-size: 36px;
  }
  :deep(h2) {
    font-size: 32px;
  }
  :deep(h3) {
    font-size: 30px;
  }
  :deep(h4) {
    font-size: 28px;
  }

  :deep(a) {
    color: #FF5F15;
  }

  :deep(strong) {
    color: #fff;
    font-weight: 600;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 32px;
    margin-bottom: 16px;
  }

  :deep(li) {
    margin-bottom: 8px;
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: rgba(255, 255, 255, 0.6);
}
</style>
