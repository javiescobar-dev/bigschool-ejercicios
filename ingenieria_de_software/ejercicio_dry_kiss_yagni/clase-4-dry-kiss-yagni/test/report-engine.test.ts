import { describe, expect, it } from 'vitest'
import { generateReport } from '../src/report-engine.ts'

describe('generateReport', () => {
  it('imprime el título subrayado, una línea por fila y el total', () => {
    const informe = generateReport(
      [
        { label: 'Ventas', value: 12500 },
        { label: 'Suscripciones', value: 3400.5 },
        { label: 'Devoluciones', value: -890 },
      ],
      'Resumen marzo',
    )

    expect(informe).toBe(
      [
        'Resumen marzo',
        '=============',
        'Ventas.............. 12.500,00 €',
        'Suscripciones....... 3.400,50 €',
        'Devoluciones........ -890,00 €',
        '-------------',
        'TOTAL............... 15.010,50 €',
      ].join('\n'),
    )
  })

  it('funciona con un informe vacío', () => {
    expect(generateReport([], 'Sin datos')).toBe(
      ['Sin datos', '=========', '---------', 'TOTAL............... 0,00 €'].join('\n'),
    )
  })
})
