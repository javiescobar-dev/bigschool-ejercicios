import type { DeviceStatus, FaxReceipt, OfficeDocument, PrintJob } from '../types.ts'

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
export function isPrinter(device: OfficeDevice): device is Printer {
  return 'print' in device
}

export interface Scanner extends OfficeDevice {
  scan(pages: number): OfficeDocument
}
export function isScanner(device: OfficeDevice): device is Scanner {
  return 'scan' in device
}

export interface FaxMachine extends OfficeDevice {
  fax(document: OfficeDocument, number: string): FaxReceipt
}
export function isFaxMachine(device: OfficeDevice): device is FaxMachine {
  return 'fax' in device
}

export interface Stapler extends OfficeDevice {
  staple(jobId: string): void
}
export function isStapler(device: OfficeDevice): device is Stapler {
  return 'staple' in device
}

export interface TonerRefillable extends OfficeDevice {
  refillToner(grams: number): number
}
export function isTonerRefillable(device: OfficeDevice): device is TonerRefillable {
  return 'refillToner' in device
}
