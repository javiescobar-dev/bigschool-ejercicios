import type { DeviceStatus, FaxReceipt, OfficeDocument, PrintJob } from '../types.ts'
import { UnsupportedOperationError, type OfficeDevice } from './office-device.ts'

/** Escáner de red de la sala de archivo. Solo digitaliza. */
export class NetworkScanner implements OfficeDevice {
  readonly model = 'ScanNet X1'
  private jobCounter = 0

  constructor(
    readonly id: string,
    private status: DeviceStatus = 'ready',
  ) {}

  getStatus(): DeviceStatus {
    return this.status
  }

  print(_document: OfficeDocument, _copies: number): PrintJob {
    throw new UnsupportedOperationError(this.model, 'print')
  }

  scan(pages: number): OfficeDocument {
    this.jobCounter += 1
    return {
      id: `${this.id}-S${this.jobCounter}`,
      name: `escaneo-${this.jobCounter}.pdf`,
      pages,
      content: `[escaneado por ${this.model}]`,
    }
  }

  fax(_document: OfficeDocument, _number: string): FaxReceipt {
    throw new UnsupportedOperationError(this.model, 'fax')
  }

  staple(_jobId: string): void {
    throw new UnsupportedOperationError(this.model, 'staple')
  }

  refillToner(_grams: number): number {
    throw new UnsupportedOperationError(this.model, 'refillToner')
  }
}
