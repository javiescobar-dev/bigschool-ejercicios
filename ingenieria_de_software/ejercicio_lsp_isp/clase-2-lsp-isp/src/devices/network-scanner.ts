import type { DeviceStatus, OfficeDocument } from '../types.ts'
import type { Scanner } from './office-device.ts'

/** Escáner de red de la sala de archivo. Solo digitaliza. */
export class NetworkScanner implements Scanner {
  readonly model = 'ScanNet X1'
  private jobCounter = 0

  constructor(
    readonly id: string,
    private status: DeviceStatus = 'ready',
  ) {}

  getStatus(): DeviceStatus {
    return this.status
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
}
