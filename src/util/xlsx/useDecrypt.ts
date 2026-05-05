import type { DecryptRequest, DecryptResponse } from './decrypt.worker'

export function decryptXlsxInWorker(buffer: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    // new URL(..., import.meta.url) 是 Vite 打包 Worker 的必要寫法
    const worker = new Worker(
      new URL('./decrypt.worker.ts', import.meta.url),
      { type: 'module' },
    )
    worker.onmessage = (e: MessageEvent<DecryptResponse>) => {
      worker.terminate()
      if (e.data.ok) resolve(e.data.buffer)
      else reject(new Error(e.data.error))
    }
    worker.onerror = (err) => {
      worker.terminate()
      reject(err)
    }
    const req: DecryptRequest = { buffer, password }
    // [buffer] 作 transferable：將 ArrayBuffer 所有權移給 Worker，省去複製
    worker.postMessage(req, [buffer])
  })
}
