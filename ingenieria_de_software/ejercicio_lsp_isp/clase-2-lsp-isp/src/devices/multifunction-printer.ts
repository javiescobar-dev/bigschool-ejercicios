import type { DeviceStatus, FaxReceipt, OfficeDocument, PrintJob } from '../types.ts'
import type { OfficeDevice } from './office-device.ts'

/** Equipo multifunción de planta: imprime, escanea, envía fax y grapa. */
export class MultifunctionPrinter implements OfficeDevice {
  readonly model = 'Konika C3500'
  private jobCounter = 0
  private toner = 400
  private stapledJobs: string[] = []

  constructor(
    readonly id: string,
    private status: DeviceStatus = 'ready',
  ) {}

  getStatus(): DeviceStatus {
    return this.status
  }

  print(document: OfficeDocument, copies: number): PrintJob {
    this.jobCounter += 1
    this.toner -= document.pages * copies
    return {
      jobId: `${this.id}-J${this.jobCounter}`,
      deviceId: this.id,
      copies,
      pages: document.pages * copies,
    }
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

  fax(document: OfficeDocument, number: string): FaxReceipt {
    return { deviceId: this.id, number, pages: document.pages }
  }

  staple(jobId: string): void {
    this.stapledJobs.push(jobId)
  }

  refillToner(grams: number): number {
    this.toner += grams
    return this.toner
  }

  stapledJobIds(): string[] {
    return [...this.stapledJobs]
  }
}
