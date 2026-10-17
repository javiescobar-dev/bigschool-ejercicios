export interface Sale {
  id: string
  date: string
  customerName: string
  amount: number
  country: string
}

export interface Refund {
  id: string
  date: string
  customerName: string
  amount: number
  reason: string
}

export interface Customer {
  id: string
  fullName: string
  email: string
  country: string
  signedUpAt: string
}

export interface Invoice {
  id: string
  total: number
  status: 'paid' | 'pending' | 'cancelled'
  dueInDays: number
}

export interface ShippingOrder {
  country: string
  weightKg: number
  subtotal: number
  isExpress: boolean
  isFragile: boolean
  isGift: boolean
}
