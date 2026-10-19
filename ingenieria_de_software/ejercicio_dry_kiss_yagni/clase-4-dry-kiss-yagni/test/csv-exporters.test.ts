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

// Diferencias entre los tres exportadores: la línea final es la única que
// diverge (suma de importes vs recuento de filas) y el escapado solo se aplica
// al texto libre. Estos tests fijan esas decisiones.

describe('casos límite y diferencias', () => {
  it('un export vacío deja la cabecera y un total a cero', () => {
    expect(exportSalesCsv([])).toBe(['id;fecha;cliente;importe;pais', 'TOTAL;;;0.00;', ''].join('\n'))
  })

  it('la línea final de clientes es un recuento, no una suma', () => {
    const csv = exportCustomersCsv([
      { id: 'C-1', fullName: 'Ana', email: 'ana@example.com', country: 'ES', signedUpAt: '2023-11-20' },
      { id: 'C-2', fullName: 'Luis', email: 'luis@example.com', country: 'PT', signedUpAt: '2023-11-21' },
    ])

    expect(csv).toContain('TOTAL;;;2;')
  })

  it('no escapa el email: solo se escapa el texto libre (nombre, motivo)', () => {
    const csv = exportCustomersCsv([
      {
        id: 'C-1',
        fullName: 'Ana;García',
        email: 'ana;raro@example.com',
        country: 'ES',
        signedUpAt: '2023-11-20',
      },
    ])

    expect(csv).toContain('Ana,García;ana;raro@example.com')
  })
})
