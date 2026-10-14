import type { DeviceStatus, FaxReceipt, OfficeDocument, PrintJob } from '../types.ts'

/**
 * Se lanza cuando a un aparato le piden algo que ese modelo concreto no sabe
 * hacer. Todos los dispositivos implementan la misma interfaz, así que esta es
 * la única forma que tienen de decir "yo de eso no sé".
 */
export class UnsupportedOperationError extends Error {
  constructor(deviceModel: string, operation: string) {
    super(`El modelo ${deviceModel} no soporta la operación "${operation}"`)
    this.name = 'UnsupportedOperationError'
  }
}

/**
 * Interfaz común de todos los aparatos de la oficina.
 */
export interface OfficeDevice {
  readonly id: string
  readonly model: string

  getStatus(): DeviceStatus
  print(document: OfficeDocument, copies: number): PrintJob
  scan(pages: number): OfficeDocument
  fax(document: OfficeDocument, number: string): FaxReceipt
  staple(jobId: string): void
  refillToner(grams: number): number
}
