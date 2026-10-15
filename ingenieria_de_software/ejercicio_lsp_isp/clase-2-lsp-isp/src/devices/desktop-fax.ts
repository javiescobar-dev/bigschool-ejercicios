import type { DeviceStatus, FaxReceipt, OfficeDocument } from '../types.ts'
import type { FaxMachine } from './office-device.ts'

/** Fax de escritorio de la sala de archivo. Solo envía fax. */
export class DesktopFax implements FaxMachine {
  readonly model = 'FaxNet X1'

  constructor(
    readonly id: string,
    private status: DeviceStatus = 'ready',
  ) {}

  getStatus(): DeviceStatus {
    return this.status
  }

  fax(document: OfficeDocument, number: string): FaxReceipt {
    return { deviceId: this.id, number, pages: document.pages }
  }
}
