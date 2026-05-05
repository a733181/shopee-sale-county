<script setup lang="ts">
import { computed } from 'vue'
import type { StatRow } from '@/types/order'
import type { FilterDef } from '@/composables/useOrderProcess'
import { exportCsv, exportXlsx } from '@/composables/useOrderProcess'

const props = defineProps<{
  stats: StatRow[]
  filters: FilterDef[]
}>()

const emit = defineEmits<{
  reset: []
}>()

const totalQty = computed(() => props.stats.reduce((s, r) => s + r.數量, 0))
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-3xl mx-auto overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <button
        class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        @click="emit('reset')"
      >
        ← 重新上傳
      </button>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium transition-all active:scale-95"
          @click="exportCsv(stats)"
        >
          📥 匯出 CSV
        </button>
        <button
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all active:scale-95"
          @click="exportXlsx(stats)"
        >
          📊 匯出 Excel
        </button>
      </div>
    </div>

    <!-- Active filters -->
    <div class="px-6 py-3 flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50">
      <span class="text-xs text-gray-400">篩選條件：</span>
      <span
        v-for="f in filters"
        :key="f.label"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
      >
        ✓ {{ f.label }}
      </span>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
            <th class="px-6 py-3 font-medium">商品名稱</th>
            <th class="px-6 py-3 font-medium">商品選項名稱</th>
            <th class="px-6 py-3 font-medium text-right">數量</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="(row, i) in stats" :key="i" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-3 text-gray-800">{{ row.商品名稱 }}</td>
            <td class="px-6 py-3 text-gray-500">{{ row.商品選項名稱 || '—' }}</td>
            <td class="px-6 py-3 text-right font-medium tabular-nums">{{ row.數量 }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-200 bg-gray-50 text-sm font-semibold">
            <td class="px-6 py-3 text-gray-500">共 {{ stats.length }} 種商品</td>
            <td></td>
            <td class="px-6 py-3 text-right tabular-nums">{{ totalQty }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
