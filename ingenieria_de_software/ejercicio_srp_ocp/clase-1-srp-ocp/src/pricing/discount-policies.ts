import type { CustomerType } from '../types.ts'

export interface DiscountPolicy {
  discountFor(subtotal: number): number
}

export class StandardDiscount implements DiscountPolicy {
  discountFor(subtotal: number): number {
    return 0
  }
}

export class PremiumDiscount implements DiscountPolicy {
  discountFor(subtotal: number): number {
    return subtotal * 0.1
  }
}

export class VipDiscount implements DiscountPolicy {
  discountFor(subtotal: number): number {
    let discount = subtotal * 0.2
    if (subtotal > 1000) {
      discount = subtotal * 0.25
    }
    return discount
  }
}

export class EmployeeDiscount implements DiscountPolicy {
  discountFor(subtotal: number): number {
    return subtotal * 0.35
  }
}

export class PartnerDiscount implements DiscountPolicy {
  discountFor(subtotal: number): number {
    return subtotal * 0.15
  }
}

export const discountPolicies: Record<CustomerType, DiscountPolicy> = {
  standard: new StandardDiscount(),
  premium:  new PremiumDiscount(),
  vip:      new VipDiscount(),
  employee: new EmployeeDiscount(),
  partner:  new PartnerDiscount(),
}
