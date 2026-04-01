<script setup>
import { onMounted, ref } from 'vue'
import { generateContent } from './services/ai'

const industries = ['宠物', '美妆', '减肥', '副业', '情感']
const FREE_LIMIT = 3
const USAGE_STORAGE_KEY = 'xhs_ai_generator_usage_count'

const form = ref({
  industry: '宠物',
  description: '',
})

const loading = ref(false)
const error = ref('')
const result = ref(null)
const usageCount = ref(0)
const showPaywall = ref(false)

const syncUsageFromStorage = () => {
  const raw = localStorage.getItem(USAGE_STORAGE_KEY)
  const parsed = Number.parseInt(raw || '0', 10)
  usageCount.value = Number.isNaN(parsed) ? 0 : parsed
}

const saveUsageToStorage = () => {
  localStorage.setItem(USAGE_STORAGE_KEY, String(usageCount.value))
}

const onUnlock = () => {
  showPaywall.value = false
  window.alert('支付流程待接入，可在此跳转收银台页面。')
}

const generateCopy = async () => {
  error.value = ''

  if (usageCount.value >= FREE_LIMIT) {
    showPaywall.value = true
    return
  }

  usageCount.value += 1
  saveUsageToStorage()
  loading.value = true

  try {
    const generated = await generateContent(form.value.industry, form.value.description)
    result.value = generated
  } catch (err) {
    error.value = err instanceof Error ? err.message : '生成失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // noop
  }
}

const copyList = async (items) => {
  await copyText(items.join('\n'))
}

onMounted(() => {
  syncUsageFromStorage()
})
</script>

<template>
  <main class="page">
    <section class="card">
      <h1>3秒生成爆款小红书文案</h1>

      <p class="quota-tip">今日免费次数：{{ Math.max(FREE_LIMIT - usageCount, 0) }}/{{ FREE_LIMIT }}</p>

      <div class="field">
        <label for="industry">行业</label>
        <select id="industry" v-model="form.industry">
          <option v-for="item in industries" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>

      <div class="field">
        <label for="desc">产品/服务描述</label>
        <textarea
          id="desc"
          v-model="form.description"
          placeholder="请输入你的产品或服务描述"
          rows="3"
        />
      </div>

      <button class="generate-btn" :disabled="loading" @click="generateCopy">
        {{ loading ? '生成中…' : '立即生成' }}
      </button>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <section v-if="loading" class="loading-box" aria-live="polite">
        <span class="loading-spinner" />
        <p>正在为你生成爆款文案，请稍候…</p>
      </section>

      <section v-if="result && !loading" class="result-grid">
        <article class="result-block">
          <div class="result-head">
            <h2>标题列表（10条）</h2>
            <button class="copy-btn" @click="copyList(result.titles)">复制全部</button>
          </div>
          <ul>
            <li v-for="(title, idx) in result.titles" :key="title">
              <span>{{ idx + 1 }}. {{ title }}</span>
              <button class="copy-btn" @click="copyText(title)">复制</button>
            </li>
          </ul>
        </article>

        <article class="result-block">
          <div class="result-head">
            <h2>文案内容</h2>
            <button class="copy-btn" @click="copyText(result.content)">复制文案</button>
          </div>
          <p>{{ result.content }}</p>
        </article>

        <article class="result-block">
          <div class="result-head">
            <h2>评论话术（3条）</h2>
            <button class="copy-btn" @click="copyList(result.comments)">复制全部</button>
          </div>
          <ul>
            <li v-for="comment in result.comments" :key="comment">
              <span>{{ comment }}</span>
              <button class="copy-btn" @click="copyText(comment)">复制</button>
            </li>
          </ul>
        </article>
      </section>
    </section>

    <div v-if="showPaywall" class="modal-mask" @click.self="showPaywall = false">
      <section class="modal-card" role="dialog" aria-modal="true" aria-label="免费次数提示">
        <h3>今日免费次数已用完</h3>
        <p>解锁无限生成，仅需9.9元</p>
        <div class="modal-actions">
          <button class="unlock-btn" @click="onUnlock">立即解锁</button>
          <button class="cancel-btn" @click="showPaywall = false">取消</button>
        </div>
      </section>
    </div>
  </main>
</template>
