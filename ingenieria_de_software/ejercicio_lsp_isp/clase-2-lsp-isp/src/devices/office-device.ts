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
}

export interface Printer extends OfficeDevice {
  print(document: OfficeDocument, copies: number): PrintJob
}

export interface Scanner extends OfficeDevice {
  scan(pages: number): OfficeDocument
}

export interface FaxMachine extends OfficeDevice {
  fax(document: OfficeDocument, number: string): FaxReceipt
}

export interface Stapler extends OfficeDevice {
  staple(jobId: string): void
}

export interface TonerRefillable extends OfficeDevice {
  refillToner(grams: number): number
}
