import type { Order, CalculatedOrder, InvoiceLine } from '../types.ts'

const TAX_RATE = 0.21

export class OrderCalculator {
    calculate(order: Order): CalculatedOrder {
        // ---------- Subtotal ----------
        let subtotal = 0
        for (const line of order.lines) {
            subtotal += line.unitPrice * line.quantity
        }

        // ---------- Descuento según el tipo de cliente ----------
        let discount = 0
        switch (order.customer.type) {
            case 'standard':
                discount = 0
                break
            case 'premium':
                discount = subtotal * 0.1
                break
            case 'vip':
                discount = subtotal * 0.2
                if (subtotal > 1000) {
                discount = subtotal * 0.25
                }
                break
            case 'employee':
                discount = subtotal * 0.35
                break
        }

        // ---------- Comisión según el método de pago ----------
        let fee = 0
        const afterDiscount = subtotal - discount
        switch (order.paymentMethod) {
            case 'card':
                fee = afterDiscount * 0.015
                break
            case 'paypal':
                fee = afterDiscount * 0.029 + 0.3
                break
            case 'transfer':
                fee = 0
                break
        }

        // ---------- Gastos de envío ----------
        let shipping = 0
        if (order.country === 'ES') {
            shipping = afterDiscount >= 50 ? 0 : 4.95
        } else if (order.country === 'PT' || order.country === 'FR') {
            shipping = afterDiscount >= 80 ? 0 : 9.95
        } else {
            shipping = 24.95
        }

        // ---------- Impuestos y total ----------
        const taxableBase = afterDiscount + fee + shipping
        const taxAmount = taxableBase * TAX_RATE
        const total = Math.round((taxableBase + taxAmount) * 100) / 100

        const lines: InvoiceLine[] = order.lines.map((line) => ({
            description: line.description,
            quantity:    line.quantity,
            total:       line.unitPrice * line.quantity,
        }))

        return { orderId: order.id, customer: order.customer, lines, subtotal, discount, fee, shipping, taxRate: TAX_RATE, taxAmount, total }
    }
}
