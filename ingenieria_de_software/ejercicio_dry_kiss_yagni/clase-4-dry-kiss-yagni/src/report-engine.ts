import { formatMoney } from './formatting.ts'

export interface ReportRow {
  label: string
  value: number
}

/** Punto de entrada que usa toda la aplicación para producir un informe. */
export function generateReport(rows: ReportRow[], title: string): string {
  const lines = [title, '='.repeat(title.length)]

  for (const row of rows) {
    lines.push(`${row.label.padEnd(20, '.')} ${formatMoney(row.value)}`)
  }

  let total = 0
  for (const row of rows) total += row.value

  lines.push('-'.repeat(title.length))
  lines.push(`${'TOTAL'.padEnd(20, '.')} ${formatMoney(total)}`)

  return lines.join('\n')
}
