export type CustomerType = 'standard' | 'premium' | 'vip' | 'employee' | 'partner'
export type PaymentMethod = 'card' | 'paypal' | 'transfer' | 'bizum'

export interface Customer {
  id: string
  name: string
  email: string
  type: CustomerType
}

export interface OrderLine {
  sku: string
  description: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  customer: Customer
  lines: OrderLine[]
  paymentMethod: PaymentMethod
  country: string
}

export interface StoredOrder {
  id: string
  customerId: string
  total: number
  createdAt: string
}

export interface SentEmail {
  to: string
  subject: string
  body: string
}

export interface InvoiceLine {
  description: string
  quantity: number
  total: number
}

export interface CalculatedOrder {
  orderId: string
  customer: Customer
  lines: InvoiceLine[]
  subtotal: number
  discount: number
  fee: number
  shipping: number
  taxAmount: number
  taxRate: number
  total: number
}
