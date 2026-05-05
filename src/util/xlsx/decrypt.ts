import XLSX from './xlsx-0.19.3.mjs'
import aesjs from 'aes-js'

const { CFB } = XLSX

// ── helpers ──────────────────────────────────────────────────────────────────

function toU8(c: unknown): Uint8Array {
  if (c instanceof Uint8Array) return c
  if (Array.isArray(c)) return new Uint8Array(c as number[])
  return new Uint8Array((c as ArrayBuffer))
}

function concat(...parts: ArrayBufferLike[]): ArrayBuffer {
  const len = parts.reduce((s, p) => s + p.byteLength, 0)
  const out = new Uint8Array(len)
  let off = 0
  for (const p of parts) { out.set(new Uint8Array(p), off); off += p.byteLength }
  return out.buffer
}

function le32(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff])
}

function utf16le(s: string): Uint8Array {
  const b = new Uint8Array(s.length * 2)
  const v = new DataView(b.buffer)
  for (let i = 0; i < s.length; i++) v.setUint16(i * 2, s.charCodeAt(i), true)
  return b
}

// ── key derivation: ECMA-376 Standard ────────────────────────────────────────
// MS-OFFCRYPTO 2.3.4.7 / msoffcrypto-tool ecma376_standard.py
//
// H0      = SHA1(salt || utf16le(password))
// Hi      = SHA1(le32(i) || H_{i-1})   for i in [0, 49999]
// Hfinal  = SHA1(H50000 || le32(0))
// buf1[j] = Hfinal[j] ^ 0x36 (j < 20)  else 0x36
// key     = SHA1(buf1)[0:keyBytes]

async function makeKey(password: string, salt: Uint8Array, keyBytes: number): Promise<Uint8Array> {
  const H = async (data: ArrayBuffer) => new Uint8Array(await crypto.subtle.digest('SHA-1', data))

  let h = await H(concat(salt, utf16le(password)))
  for (let i = 0; i < 50000; i++)
    h = await H(concat(le32(i), h))
  const hfinal = await H(concat(h, le32(0)))

  const buf1 = new Uint8Array(64).fill(0x36)
  for (let j = 0; j < 20; j++) buf1[j] ^= hfinal[j]
  const x1 = await H(buf1)
  return x1.subarray(0, keyBytes)
}

// ── AES-128-ECB (via aes-js) ─────────────────────────────────────────────────

function ecbDecrypt(key: Uint8Array, data: Uint8Array): Uint8Array {
  const cipher = new aesjs.ModeOfOperation.ecb(key)
  // aes-js requires multiple of 16
  return new Uint8Array(cipher.decrypt(data))
}

// ── verify password via EncryptionVerifier ────────────────────────────────────

function verifyPassword(
  key: Uint8Array,
  encVerifier: Uint8Array,
  encVerHashPadded: Uint8Array,
  hashSize: number,
): boolean {
  // Decrypt verifier (16 bytes) and hash (32 bytes padded) with AES-ECB
  const ver  = ecbDecrypt(key, encVerifier)
  const hash = ecbDecrypt(key, encVerHashPadded).subarray(0, hashSize)
  // SHA-1(decryptedVerifier) should equal decryptedHash
  // Use sync comparison since we can't easily await here
  return ver.length > 0 && hash.length > 0  // actual check done inside decryptXlsx
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Decrypt a password-protected .xlsx file (ECMA-376 Standard Encryption).
 * Returns a plain xlsx ArrayBuffer that XLSX.read() can parse without a password.
 *
 * @param buffer   ArrayBuffer of the encrypted .xlsx file
 * @param password Plain-text password
 */
export async function decryptXlsx(buffer: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  const cfb = CFB.read(new Uint8Array(buffer), { type: 'array' })

  const infoEntry = CFB.find(cfb, 'EncryptionInfo')
  const pkgEntry  = CFB.find(cfb, 'EncryptedPackage')
  if (!infoEntry || !pkgEntry) throw new Error('Not an encrypted Office file')

  const raw = toU8(infoEntry.content)
  const pkg = toU8(pkgEntry.content)

  // Parse EncryptionInfo: 4 bytes version, 4 bytes flags, 4 bytes hdrSize
  const hdrSize = raw[8] | (raw[9] << 8) | (raw[10] << 16) | (raw[11] << 24)
  const vs = 12 + hdrSize   // EncryptionVerifier offset

  // AlgID at header+8: 0x660E=AES-128, 0x660F=AES-192, 0x6610=AES-256
  const keyBytes = (raw[12 + 16] | (raw[12 + 17] << 8)) / 8  // KeySize in bytes

  const salt          = raw.slice(vs + 4,  vs + 20)
  const encVerifier   = raw.slice(vs + 20, vs + 36)
  const hashSize      = raw[vs + 36] | (raw[vs + 37] << 8) | (raw[vs + 38] << 16) | (raw[vs + 39] << 24)
  const encVerHashPad = raw.slice(vs + 40, vs + 40 + Math.ceil(hashSize / 16) * 16)

  // Derive key (slow: 50000 SHA-1 iterations)
  const key = await makeKey(password, salt, keyBytes)

  // Verify password
  const decVer  = ecbDecrypt(key, encVerifier)
  const decHash = ecbDecrypt(key, encVerHashPad).subarray(0, hashSize)
  const expectedHash = new Uint8Array(await crypto.subtle.digest('SHA-1', decVer))
  if (!expectedHash.every((b, i) => b === decHash[i]))
    throw new Error('Wrong password')

  // Decrypt package: first 4 bytes = uint32 plaintext size, skip 8 bytes, then AES-ECB
  const totalSize = pkg[0] | (pkg[1] << 8) | (pkg[2] << 16) | (pkg[3] << 24)
  const encData   = pkg.slice(8)
  const plain     = ecbDecrypt(key, encData).subarray(0, totalSize)

  return plain.buffer.slice(plain.byteOffset, plain.byteOffset + plain.byteLength)
}
