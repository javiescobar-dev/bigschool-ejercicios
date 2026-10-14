import { BasicInkjetPrinter } from './devices/basic-inkjet-printer.ts'
import { MultifunctionPrinter } from './devices/multifunction-printer.ts'
import { NetworkScanner } from './devices/network-scanner.ts'
import { UnsupportedOperationError, type OfficeDevice } from './devices/office-device.ts'
import type { FaxReceipt, OfficeDocument, PrintJob } from './types.ts'

/**
 * Coordina el parque de aparatos de la oficina: reparte cada tarea entre los
 * dispositivos disponibles.
 */
export class OfficeWorkflow {
  constructor(private readonly devices: OfficeDevice[]) {}

  printDocument(document: OfficeDocument, copies: number): PrintJob {
    for (const device of this.devices) {
      if (device.getStatus() !== 'ready') continue
      try {
        return device.print(document, copies)
      } catch (error) {
        // Puede que este aparato no sepa imprimir. Solo hay una forma de
        // averiguarlo: intentarlo y ver si explota.
        if (error instanceof UnsupportedOperationError) continue
        throw error
      }
    }
    throw new Error('No hay ningún dispositivo disponible capaz de imprimir')
  }

  digitize(pages: number): OfficeDocument {
    for (const device of this.devices) {
      if (device.getStatus() !== 'ready') continue
      try {
        return device.scan(pages)
      } catch (error) {
        if (error instanceof UnsupportedOperationError) continue
        throw error
      }
    }
    throw new Error('No hay ningún dispositivo disponible capaz de escanear')
  }

  sendFax(document: OfficeDocument, number: string): FaxReceipt {
    for (const device of this.devices) {
      if (device.getStatus() !== 'ready') continue
      try {
        return device.fax(document, number)
      } catch (error) {
        if (error instanceof UnsupportedOperationError) continue
        throw error
      }
    }
    throw new Error('No hay ningún dispositivo disponible capaz de enviar faxes')
  }

  printAndStaple(document: OfficeDocument, copies: number): PrintJob {
    const job = this.printDocument(document, copies)
    const device = this.devices.find((candidate) => candidate.id === job.deviceId)
    try {
      device?.staple(job.jobId)
    } catch (error) {
      // Si el aparato que ha impreso no grapa, se recoge sin grapar y ya.
      if (!(error instanceof UnsupportedOperationError)) throw error
    }
    return job
  }

  /**
   * Inventario de capacidades para el informe de mantenimiento.
   */
  capabilitiesReport(): string[] {
    return this.devices.map((device) => {
      if (device instanceof MultifunctionPrinter) {
        return `${device.id} (${device.model}): imprime, escanea, faxea, grapa, tóner`
      }
      if (device instanceof BasicInkjetPrinter) {
        return `${device.id} (${device.model}): imprime`
      }
      if (device instanceof NetworkScanner) {
        return `${device.id} (${device.model}): escanea`
      }
      return `${device.id} (${device.model}): desconocido`
    })
  }
}
