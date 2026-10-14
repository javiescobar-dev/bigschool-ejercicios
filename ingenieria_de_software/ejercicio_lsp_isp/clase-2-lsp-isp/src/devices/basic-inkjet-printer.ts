import type { DeviceStatus, FaxReceipt, OfficeDocument, PrintJob } from '../types.ts'
import { UnsupportedOperationError, type OfficeDevice } from './office-device.ts'

/** Impresora de chorro de tinta de sobremesa. Solo imprime. */
export class BasicInkjetPrinter implements OfficeDevice {
  readonly model = 'Inkly 220'
  private jobCounter = 0

  constructor(
    readonly id: string,
    private status: DeviceStatus = 'ready',
  ) {}

  getStatus(): DeviceStatus {
    return this.status
  }

  print(document: OfficeDocument, copies: number): PrintJob {
    this.jobCounter += 1
    return {
      jobId: `${this.id}-J${this.jobCounter}`,
      deviceId: this.id,
      copies,
      pages: document.pages * copies,
    }
  }

  scan(_pages: number): OfficeDocument {
    throw new UnsupportedOperationError(this.model, 'scan')
  }

  fax(_document: OfficeDocument, _number: string): FaxReceipt {
    throw new UnsupportedOperationError(this.model, 'fax')
  }

  staple(_jobId: string): void {
    throw new UnsupportedOperationError(this.model, 'staple')
  }

  refillToner(_grams: number): number {
    // Es de tinta, no de tóner. Devolvemos 0 para no romper a quien llame.
    return 0
  }
}
