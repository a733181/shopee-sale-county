<script setup lang="ts">
import { ref } from 'vue'
import { useDropzone } from 'vue3-dropzone'

const props = defineProps<{
  loading: boolean
  errorMsg: string
}>()

const emit = defineEmits<{
  submit: [file: File, password: string]
}>()

const file = ref<File | null>(null)
const password = ref('')
const showPwd = ref(false)
const dropError = ref('')

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  accept: '.xlsx',
  multiple: false,
  maxFiles: 1,
  onDrop(accepted, rejections) {
    dropError.value = ''
    if (rejections.length > 0) {
      dropError.value = '僅接受 .xlsx 格式，且只能選擇一個檔案'
      return
    }
    file.value = (accepted[0] as File) ?? null
  },
})

function removeFile(e: Event) {
  e.stopPropagation()
  file.value = null
  dropError.value = ''
}

function submit() {
  if (!file.value || props.loading) return
  emit('submit', file.value, password.value)
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md mx-auto">
    <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">📦 Shopee 訂單分析</h1>

    <!-- Dropzone -->
    <div
      v-bind="getRootProps()"
      class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none"
      :class="[
        isDragActive ? 'border-orange-400 bg-orange-50' :
        file ? 'border-green-400 bg-green-50' :
        'border-gray-300 hover:border-orange-300 hover:bg-gray-50'
      ]"
    >
      <input v-bind="getInputProps()" />
      <template v-if="!file">
        <div class="text-4xl mb-3">📁</div>
        <p class="text-gray-600">拖放 <code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.xlsx</code> 至此</p>
        <p class="text-sm text-gray-400 mt-1">或點擊選擇檔案</p>
      </template>
      <template v-else>
        <div class="flex items-center gap-3">
          <span class="text-2xl shrink-0">📄</span>
          <span class="text-gray-700 font-medium truncate flex-1 text-left text-sm">{{ file.name }}</span>
          <button
            class="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors text-lg leading-none"
            @click="removeFile"
          >×</button>
        </div>
      </template>
    </div>
    <p v-if="dropError" class="mt-2 text-xs text-red-500">{{ dropError }}</p>

    <!-- Password -->
    <div class="mt-5">
      <label class="block text-sm font-medium text-gray-700 mb-1.5">Excel 密碼</label>
      <div class="relative">
        <input
          v-model="password"
          :type="showPwd ? 'text' : 'password'"
          placeholder="若無密碼請留空"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-14 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition"
          @keydown.enter="submit"
        />
        <button
          type="button"
          class="absolute inset-y-0 right-3 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          @click="showPwd = !showPwd"
        >{{ showPwd ? '隱藏' : '顯示' }}</button>
      </div>
    </div>

    <!-- Error -->
    <p v-if="errorMsg" class="mt-3 text-sm text-red-500">⚠️ {{ errorMsg }}</p>

    <!-- Submit -->
    <button
      :disabled="!file || loading"
      class="mt-6 w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
      :class="file && !loading
        ? 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98] cursor-pointer'
        : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
      @click="submit"
    >
      <span v-if="loading" class="inline-flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        分析中…
      </span>
      <span v-else>開始分析</span>
    </button>
  </div>
</template>
