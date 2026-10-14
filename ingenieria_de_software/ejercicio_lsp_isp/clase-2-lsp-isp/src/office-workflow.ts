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
      device?.staple(job.jobId)
    }
    return job
  }

  /**
   * Inventario de capacidades para el informe de mantenimiento.
   */
  capabilitiesReport(): string[] {
    return this.devices.map((device) => {
      if (isPrinter(device) && isScanner(device) && isFaxMachine(device) && isStapler(device) && isTonerRefillable(device)) {
        return `${device.id} (${device.model}): imprime, escanea, faxea, grapa, tóner`
      }
      if (isPrinter(device)) {
        return `${device.id} (${device.model}): imprime`
      }
      if (isScanner(device)) {
        return `${device.id} (${device.model}): escanea`
      }
      return `${device.id} (${device.model}): desconocido`
    })
  }
}
