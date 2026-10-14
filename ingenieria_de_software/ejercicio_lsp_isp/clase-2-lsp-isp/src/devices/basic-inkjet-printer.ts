import type { DeviceStatus, OfficeDocument, PrintJob } from '../types.ts'
import type { Printer } from './office-device.ts'

/** Impresora de chorro de tinta de sobremesa. Solo imprime. */
export class BasicInkjetPrinter implements Printer {
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
}
