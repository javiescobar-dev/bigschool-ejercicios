import { describe, expect, it } from 'vitest'
import { exportCustomersCsv, exportRefundsCsv, exportSalesCsv } from '../src/csv-exporters.ts'

describe('exportSalesCsv', () => {
  it('genera la cabecera, una fila por venta y la línea de total', () => {
    const csv = exportSalesCsv([
      { id: 'V-1', date: '2024-03-01', customerName: 'Ana García', amount: 120.5, country: 'ES' },
      { id: 'V-2', date: '2024-03-04', customerName: 'Luis Pérez', amount: 79.5, country: 'PT' },
    ])

    expect(csv).toBe(
      [
        'id;fecha;cliente;importe;pais',
        'V-1;1 de marzo de 2024;Ana García;120.50;ES',
        'V-2;4 de marzo de 2024;Luis Pérez;79.50;PT',
        'TOTAL;;;200.00;',
        '',
      ].join('\n'),
    )
  })

  it('sustituye los puntos y coma del nombre para no romper las columnas', () => {
    const csv = exportSalesCsv([
      { id: 'V-1', date: '2024-03-01', customerName: 'Ana; García', amount: 10, country: 'ES' },
    ])

    expect(csv).toContain('V-1;1 de marzo de 2024;Ana, García;10.00;ES')
  })
})

describe('exportRefundsCsv', () => {
  it('genera la cabecera, una fila por devolución y la línea de total', () => {
    const csv = exportRefundsCsv([
      { id: 'D-1', date: '2024-03-02', customerName: 'Ana García', amount: 30, reason: 'Talla' },
    ])

    expect(csv).toBe(
      ['id;fecha;cliente;importe;motivo', 'D-1;2 de marzo de 2024;Ana García;30.00;Talla', 'TOTAL;;;30.00;', ''].join(
        '\n',
      ),
    )
  })

  it('también limpia los puntos y coma del motivo', () => {
    const csv = exportRefundsCsv([
      { id: 'D-1', date: '2024-03-02', customerName: 'Ana', amount: 30, reason: 'Rota; sin caja' },
    ])

    expect(csv).toContain('Rota, sin caja')
  })
})

describe('exportCustomersCsv', () => {
  it('genera la cabecera, una fila por cliente y el recuento final', () => {
    const csv = exportCustomersCsv([
      {
        id: 'C-1',
        fullName: 'Ana García',
        email: 'ana@example.com',
        country: 'ES',
        signedUpAt: '2023-11-20',
      },
    ])

    expect(csv).toBe(
      [
        'id;alta;nombre;email;pais',
        'C-1;20 de noviembre de 2023;Ana García;ana@example.com;ES',
        'TOTAL;;;1;',
        '',
      ].join('\n'),
    )
  })
})
