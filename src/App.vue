<script setup lang="ts">
import { ref } from 'vue'
import UploadCard from '@/components/UploadCard.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import ResultsPanel from '@/components/ResultsPanel.vue'
import { parseFile, processRows } from '@/composables/useOrderProcess'
import type { RawRow } from '@/composables/useOrderProcess'
import type { StatRow } from '@/types/order'

const screen = ref<'upload' | 'filter' | 'results'>('upload')
const loading = ref(false)
const errorMsg = ref('')

const rawRows = ref<RawRow[]>([])
const allStatuses = ref<string[]>([])
const excludedStatuses = ref<string[] | undefined>(undefined)
const stats = ref<StatRow[]>([])

async function handleSubmit(file: File, password: string) {
  loading.value = true
  errorMsg.value = ''
  try {
    const parsed = await parseFile(file, password)
    rawRows.value = parsed.rows
    allStatuses.value = parsed.statuses
    screen.value = 'filter'
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function handleConfirm(excluded: string[]) {
  excludedStatuses.value = excluded.length ? excluded : undefined
  const excludedSet = new Set(excluded)
  const included = allStatuses.value.filter(s => !excludedSet.has(s))
  stats.value = processRows(rawRows.value, included)
  screen.value = 'results'
}

function reset() {
  screen.value = 'upload'
  rawRows.value = []
  allStatuses.value = []
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
        <FilterPanel
          v-else-if="screen === 'filter'"
          :statuses="allStatuses"
          :initial-excluded="excludedStatuses"
          @confirm="handleConfirm"
          @back="screen = 'upload'"
        />
        <ResultsPanel
          v-else
          :stats="stats"
          :excluded-statuses="excludedStatuses ?? []"
          @reset="reset"
          @refilter="screen = 'filter'"
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
