export interface ShipmentPolicy {
  shippingFor(afterDiscount: number): number
}

export class SpainShipmentPolicy implements ShipmentPolicy {
  shippingFor(afterDiscount: number): number {
    return afterDiscount >= 50 ? 0 : 4.95
  }
}

export class EUShipmentPolicy implements ShipmentPolicy {
  shippingFor(afterDiscount: number): number {
    return afterDiscount >= 80 ? 0 : 9.95
  }
}

export class InternationalShipmentPolicy implements ShipmentPolicy {
  shippingFor(afterDiscount: number): number {
    return 24.95
  }
}

export const shipmentPolicies: Record<string, ShipmentPolicy> = {
  'ES': new SpainShipmentPolicy(),
  'PT': new EUShipmentPolicy(),
  'FR': new EUShipmentPolicy(),
}
