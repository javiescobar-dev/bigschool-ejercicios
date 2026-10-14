import { isFaxMachine, isPrinter, isScanner, isStapler, isTonerRefillable, type OfficeDevice } from './devices/office-device.ts'
import type { FaxReceipt, OfficeDocument, PrintJob } from './types.ts'

/**
 * Coordina el parque de aparatos de la oficina: reparte cada tarea entre los
 * dispositivos disponibles.
 */
export class OfficeWorkflow {
  constructor(private readonly devices: OfficeDevice[]) {}

  printDocument(document: OfficeDocument, copies: number): PrintJob {
    for (const device of this.devices) {
      if (device.getStatus() !== 'ready' || !isPrinter(device)) continue
      return device.print(document, copies)
    }
    throw new Error('No hay ningún dispositivo disponible capaz de imprimir')
  }

  digitize(pages: number): OfficeDocument {
    for (const device of this.devices) {
      if (device.getStatus() !== 'ready' || !isScanner(device)) continue
      return device.scan(pages)
    }
    throw new Error('No hay ningún dispositivo disponible capaz de escanear')
  }

  sendFax(document: OfficeDocument, number: string): FaxReceipt {
    for (const device of this.devices) {
      if (device.getStatus() !== 'ready' || !isFaxMachine(device)) continue
      return device.fax(document, number)
    }
    throw new Error('No hay ningún dispositivo disponible capaz de enviar faxes')
  }

  printAndStaple(document: OfficeDocument, copies: number): PrintJob {
    const job = this.printDocument(document, copies)
    const device = this.devices.find((candidate) => candidate.id === job.deviceId)
    if (device && isStapler(device)) {
      device.staple(job.jobId)
    }
    return job
  }

  /**
   * Inventario de capacidades para el informe de mantenimiento.
   */
  capabilitiesReport(): string[] {
    const report: string[] = []
    for (const device of this.devices) {
      const capabilities: string[] = []
      if (isPrinter(device)) capabilities.push('imprime')
      if (isScanner(device)) capabilities.push('escanea')
      if (isFaxMachine(device)) capabilities.push('faxea')
      if (isStapler(device)) capabilities.push('grapa')
      if (isTonerRefillable(device)) capabilities.push('tóner')
      if (capabilities.length > 0) {
        report.push(`${device.id} (${device.model}): ${capabilities.join(', ')}`)
      }
      else {
        report.push(`${device.id} (${device.model}): desconocido`)
      }
    }

    return report
  }
}
