import XLSX from '@/util/xlsx/xlsx-0.19.3.mjs'
import { decryptXlsxInWorker } from '@/util/xlsx/useDecrypt'
import type { StatRow } from '@/types/order'

type RawRow = Record<string, string | number>

// ── Filters ──────────────────────────────────────────────────────────────────
// Add entries here to extend filter logic; all filters are ANDed together.

export interface FilterDef {
  label: string
  fn: (row: RawRow) => boolean
}

export const ACTIVE_FILTERS: FilterDef[] = [
  { label: '訂單狀態：已完成', fn: (row) => String(row['訂單狀態']) === '已完成' },
]

function applyFilters(rows: RawRow[]): RawRow[] {
  return rows.filter(row => ACTIVE_FILTERS.every(f => f.fn(row)))
}

// ── Aggregation ───────────────────────────────────────────────────────────────

function aggregateStats(rows: RawRow[]): StatRow[] {
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = `${row['商品名稱']}\x00${row['商品選項名稱'] ?? ''}`
    map.set(key, (map.get(key) ?? 0) + (Number(row['數量']) || 0))
  }
  return Array.from(map.entries())
    .map(([key, qty]) => {
      const sep = key.indexOf('\x00')
      return { 商品名稱: key.slice(0, sep), 商品選項名稱: key.slice(sep + 1), 數量: qty }
    })
    .sort((a, b) => b.數量 - a.數量)
}

// ── Main process ──────────────────────────────────────────────────────────────

export async function processFile(file: File, password: string): Promise<StatRow[]> {
  const buffer = await file.arrayBuffer()

  let xlsxBuffer: ArrayBuffer
  try {
    xlsxBuffer = password ? await decryptXlsxInWorker(buffer, password) : buffer
  } catch (e) {
    const msg = (e as Error).message
    throw new Error(msg === 'Wrong password' ? '密碼錯誤，請確認後再試' : msg)
  }

  const wb = XLSX.read(new Uint8Array(xlsxBuffer), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: RawRow[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

  return aggregateStats(applyFilters(rows))
}

// ── Export ────────────────────────────────────────────────────────────────────
// Add export functions here to extend export options.

function escCsv(v: string | number): string {
  const s = String(v)
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCsv(stats: StatRow[]): void {
  const cols: (keyof StatRow)[] = ['商品名稱', '商品選項名稱', '數量']
  const lines = [cols.join(','), ...stats.map(r => cols.map(c => escCsv(r[c])).join(','))]
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: 'shopee-stats.csv' })
  a.click()
  URL.revokeObjectURL(url)
}

export function exportXlsx(stats: StatRow[]): void {
  const ws = XLSX.utils.json_to_sheet(stats, { header: ['商品名稱', '商品選項名稱', '數量'] })
  ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 8 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '統計')
  XLSX.writeFile(wb, 'shopee-stats.xlsx')
}
