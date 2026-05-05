<script setup lang="ts">
import { ref } from 'vue'
import UploadCard from '@/components/UploadCard.vue'
import ResultsPanel from '@/components/ResultsPanel.vue'
import { processFile, ACTIVE_FILTERS } from '@/composables/useOrderProcess'
import type { StatRow } from '@/types/order'

const screen = ref<'upload' | 'results'>('upload')
const loading = ref(false)
const errorMsg = ref('')
const stats = ref<StatRow[]>([])

async function handleSubmit(file: File, password: string) {
  loading.value = true
  errorMsg.value = ''
  try {
    stats.value = await processFile(file, password)
    screen.value = 'results'
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function reset() {
  screen.value = 'upload'
  stats.value = []
  errorMsg.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Privacy warning -->
    <div class="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <p class="text-center text-amber-800 text-sm">
        🔒 上傳的檔案僅在您的瀏覽器內執行，不會傳送至任何伺服器
      </p>
    </div>

    <main class="flex-1 flex items-start justify-center px-4 py-12">
      <Transition name="fade" mode="out-in">
        <UploadCard
          v-if="screen === 'upload'"
          :loading="loading"
          :error-msg="errorMsg"
          @submit="handleSubmit"
        />
        <ResultsPanel
          v-else
          :stats="stats"
          :filters="ACTIVE_FILTERS"
          @reset="reset"
        />
      </Transition>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
