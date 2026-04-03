<script setup>
import { onMounted, ref } from "vue"
import { generateContent } from "./services/ai"

const industries = ["Pet", "Beauty", "Fitness", "Side Hustle", "Relationship"]
const FREE_LIMIT = 3
const USAGE_STORAGE_KEY = "xhs_ai_generator_usage_count"

const form = ref({
  industry: "Pet",
  description: "",
})

const loading = ref(false)
const error = ref("")
const result = ref(null)
const usageCount = ref(0)
const showPaywall = ref(false)

const syncUsageFromStorage = () => {
  const raw = localStorage.getItem(USAGE_STORAGE_KEY)
  const parsed = Number.parseInt(raw || "0", 10)
  usageCount.value = Number.isNaN(parsed) ? 0 : parsed
}

const saveUsageToStorage = () => {
  localStorage.setItem(USAGE_STORAGE_KEY, String(usageCount.value))
}

const onUnlock = () => {
  showPaywall.value = false
  window.alert("Payment flow is not connected yet. You can redirect to your checkout page here.")
}

const generateCopy = async () => {
  error.value = ""

  if (usageCount.value >= FREE_LIMIT) {
    showPaywall.value = true
    return
  }

  usageCount.value += 1
  saveUsageToStorage()
  loading.value = true

  try {
    result.value = await generateContent(form.value.industry, form.value.description)
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Generation failed. Please try again later."
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
  await copyText(items.join("\n"))
}

onMounted(() => {
  syncUsageFromStorage()
})
</script>

<template>
  <main class="page">
    <section class="card">
      <h1>Xiaohongshu AI Copy Generator</h1>
      <p class="quota-tip">Free tries today: {{ Math.max(FREE_LIMIT - usageCount, 0) }}/{{ FREE_LIMIT }}</p>

      <div class="field">
        <label for="industry">Industry</label>
        <select id="industry" v-model="form.industry">
          <option v-for="item in industries" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>

      <div class="field">
        <label for="desc">Product or service description</label>
        <textarea
          id="desc"
          v-model="form.description"
          placeholder="Describe your selling points, target users, and usage scenarios"
          rows="4"
        />
      </div>

      <button class="generate-btn" :disabled="loading" @click="generateCopy">
        {{ loading ? "Generating..." : "Generate now" }}
      </button>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <section v-if="loading" class="loading-box" aria-live="polite">
        <span class="loading-spinner" />
        <p>Generating your Xiaohongshu copy, please wait...</p>
      </section>

      <section v-if="result && !loading" class="result-grid">
        <article class="result-block">
          <div class="result-head">
            <h2>Titles (10)</h2>
            <button class="copy-btn" @click="copyList(result.titles)">Copy all</button>
          </div>
          <ul>
            <li v-for="(title, idx) in result.titles" :key="`${idx}-${title}`">
              <span>{{ idx + 1 }}. {{ title }}</span>
              <button class="copy-btn" @click="copyText(title)">Copy</button>
            </li>
          </ul>
        </article>

        <article class="result-block">
          <div class="result-head">
            <h2>Main content</h2>
            <button class="copy-btn" @click="copyText(result.content)">Copy content</button>
          </div>
          <p>{{ result.content }}</p>
        </article>

        <article class="result-block">
          <div class="result-head">
            <h2>Comment ideas (3)</h2>
            <button class="copy-btn" @click="copyList(result.comments)">Copy all</button>
          </div>
          <ul>
            <li v-for="(comment, idx) in result.comments" :key="`${idx}-${comment}`">
              <span>{{ comment }}</span>
              <button class="copy-btn" @click="copyText(comment)">Copy</button>
            </li>
          </ul>
        </article>
      </section>
    </section>

    <div v-if="showPaywall" class="modal-mask" @click.self="showPaywall = false">
      <section class="modal-card" role="dialog" aria-modal="true" aria-label="Usage limit reminder">
        <h3>No free tries left today</h3>
        <p>Unlock unlimited generations for CNY 9.9.</p>
        <div class="modal-actions">
          <button class="unlock-btn" @click="onUnlock">Unlock now</button>
          <button class="cancel-btn" @click="showPaywall = false">Cancel</button>
        </div>
      </section>
    </div>
  </main>
</template>
