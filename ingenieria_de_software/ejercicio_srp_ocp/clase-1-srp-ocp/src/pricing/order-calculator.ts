import type { Order, CalculatedOrder, InvoiceLine } from '../types.ts'
import { discountPolicies } from './discount-policies.ts'
import { feePolicies } from './payment-fee-policies.ts'
import { shipmentPolicies, InternationalShipmentPolicy } from './shipping-policies.ts'

const TAX_RATE = 0.21

export class OrderCalculator {
    calculate(order: Order): CalculatedOrder {
        // ---------- Subtotal ----------
        let subtotal = 0
        for (const line of order.lines) {
            subtotal += line.unitPrice * line.quantity
        }

        // ---------- Descuento según el tipo de cliente ----------
        const discount = discountPolicies[order.customer.type].discountFor(subtotal)
        const afterDiscount = subtotal - discount

        // ---------- Comisión según el método de pago ----------
        const fee = feePolicies[order.paymentMethod].feeFor(afterDiscount)

        // ---------- Gastos de envío ----------
        const internationalShipment = new InternationalShipmentPolicy()
        const shipping = (shipmentPolicies[order.country] ?? internationalShipment).shippingFor(afterDiscount)

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
