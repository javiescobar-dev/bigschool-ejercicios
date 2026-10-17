import { exportSalesCsv } from './csv-exporters.ts'
import { calculateShippingCost } from './pricing.ts'
import { generateReport } from './report-engine.ts'
import { invoiceLabel, sortInvoicesByTotalDesc } from './formatting.ts'

console.log('--- Informe ---')
console.log(
  generateReport(
    [
      { label: 'Ventas', value: 12500 },
      { label: 'Suscripciones', value: 3400.5 },
      { label: 'Devoluciones', value: -890 },
    ],
    'Resumen marzo',
  ),
)

console.log('\n--- CSV de ventas ---')
console.log(
  exportSalesCsv([
    { id: 'V-1', date: '2024-03-01', customerName: 'Ana García', amount: 120.5, country: 'ES' },
    { id: 'V-2', date: '2024-03-04', customerName: 'Luis Pérez', amount: 79.5, country: 'PT' },
  ]),
)

console.log('--- Envíos ---')
for (const escenario of [
  { country: 'ES', weightKg: 2, subtotal: 30, isExpress: false, isFragile: false, isGift: false },
  { country: 'ES', weightKg: 12, subtotal: 30, isExpress: true, isFragile: true, isGift: true },
  { country: 'US', weightKg: 2, subtotal: 300, isExpress: false, isFragile: false, isGift: false },
]) {
  const etiquetas = [
    escenario.country,
    `${escenario.weightKg}kg`,
    `subtotal ${escenario.subtotal}`,
    escenario.isExpress ? 'exprés' : 'estándar',
    escenario.isFragile ? 'frágil' : null,
    escenario.isGift ? 'regalo' : null,
  ].filter(Boolean)
  console.log(etiquetas.join(' · '), '->', calculateShippingCost(escenario), 'EUR')
}

console.log('\n--- Facturas ---')
const facturas = [
  { id: 'F-1', total: 1500, status: 'paid' as const, dueInDays: 0 },
  { id: 'F-2', total: 80, status: 'pending' as const, dueInDays: -2 },
  { id: 'F-3', total: 420, status: 'cancelled' as const, dueInDays: 10 },
]
for (const factura of sortInvoicesByTotalDesc(facturas)) {
  console.log(factura.id, '->', invoiceLabel(factura))
}
