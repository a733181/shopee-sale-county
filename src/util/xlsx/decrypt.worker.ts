import { decryptXlsx } from './decrypt'

export type DecryptRequest = { buffer: ArrayBuffer; password: string }
export type DecryptResponse =
  | { ok: true; buffer: ArrayBuffer }
  | { ok: false; error: string }

self.onmessage = async (e: MessageEvent<DecryptRequest>) => {
  try {
    const result = await decryptXlsx(e.data.buffer, e.data.password)
    const res: DecryptResponse = { ok: true, buffer: result }
    // transfer 將 ArrayBuffer 所有權移交主執行緒，避免複製大型檔案
    self.postMessage(res, { transfer: [result] })
  } catch (err) {
    const res: DecryptResponse = { ok: false, error: (err as Error).message }
    self.postMessage(res)
  }
}
