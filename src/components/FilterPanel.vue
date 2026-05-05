<script setup lang="ts">
import { ref, computed } from 'vue'
import VueSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

const props = defineProps<{
  statuses: string[]
  // 上次選擇的排除清單；有值時優先使用，否則預設排除含「不成立」的狀態
  initialExcluded?: string[]
}>()

const emit = defineEmits<{
  confirm: [excluded: string[]]
  back: []
}>()

// 排除清單是唯一 source of truth；加總清單由此反推。
const excluded = ref<string[]>(
  props.initialExcluded ?? props.statuses.filter(s => s.includes('不成立')),
)

// 加總清單 = 所有狀態 - 排除清單（互斥）
// setter：當使用者修改加總清單時，同步更新排除清單
const included = computed<string[]>({
  get: () => props.statuses.filter(s => !excluded.value.includes(s)),
  set: (newIncluded: string[]) => {
    const incSet = new Set(newIncluded)
    excluded.value = props.statuses.filter(s => !incSet.has(s))
  },
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md mx-auto">
    <button
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      @click="emit('back')"
    >
      ← 返回
    </button>

    <h2 class="text-lg font-bold text-gray-800 mb-5">篩選訂單狀態</h2>

    <div class="space-y-4">
      <!-- 要加總的狀態（互斥：此處選取後會從「排除」移除） -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">要加總的訂單狀態</label>
        <VueSelect
          v-model="included"
          :options="statuses"
          :multiple="true"
          :close-on-select="false"
          placeholder="選擇要計算的狀態…"
        />
      </div>

      <!-- 排除的狀態（互斥：此處選取後會從「加總」移除） -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">排除的訂單狀態</label>
        <VueSelect
          v-model="excluded"
          :options="statuses"
          :multiple="true"
          :close-on-select="false"
          placeholder="選擇要排除的狀態…"
        />
      </div>
    </div>

    <button
      :disabled="included.length === 0"
      class="mt-6 w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
      :class="
        included.length > 0
          ? 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98] cursor-pointer'
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
      "
      @click="emit('confirm', excluded)"
    >
      開始分析
    </button>
  </div>
</template>
