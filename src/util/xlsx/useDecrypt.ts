import type { DecryptRequest, DecryptResponse } from './decrypt.worker'

export function decryptXlsxInWorker(buffer: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
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
    worker.postMessage(req, [buffer])
  })
}
