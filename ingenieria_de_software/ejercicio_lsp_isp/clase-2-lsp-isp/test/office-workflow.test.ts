import { beforeEach, describe, expect, it } from 'vitest'
import { OfficeWorkflow } from '../src/office-workflow.ts'
import { MultifunctionPrinter } from '../src/devices/multifunction-printer.ts'
import { BasicInkjetPrinter } from '../src/devices/basic-inkjet-printer.ts'
import { NetworkScanner } from '../src/devices/network-scanner.ts'
import type { OfficeDocument } from '../src/types.ts'

const contrato: OfficeDocument = {
  id: 'doc-1',
  name: 'contrato.pdf',
  pages: 3,
  content: 'Cláusulas varias',
}

describe('OfficeWorkflow', () => {
  let multifuncion: MultifunctionPrinter
  let inkjet: BasicInkjetPrinter
  let escaner: NetworkScanner

  beforeEach(() => {
    multifuncion = new MultifunctionPrinter('planta-2')
    inkjet = new BasicInkjetPrinter('recepcion')
    escaner = new NetworkScanner('archivo')
  })

  describe('imprimir', () => {
    it('usa el primer dispositivo disponible que sepa imprimir', () => {
      const workflow = new OfficeWorkflow([multifuncion, inkjet])

      const job = workflow.printDocument(contrato, 2)

      expect(job.deviceId).toBe('planta-2')
      expect(job.pages).toBe(6)
    })

    it('se salta los dispositivos que no saben imprimir', () => {
      const workflow = new OfficeWorkflow([escaner, inkjet])

      const job = workflow.printDocument(contrato, 1)

      expect(job.deviceId).toBe('recepcion')
    })

    it('se salta los dispositivos que no están listos', () => {
      const workflow = new OfficeWorkflow([new MultifunctionPrinter('planta-2', 'offline'), inkjet])

      const job = workflow.printDocument(contrato, 1)

      expect(job.deviceId).toBe('recepcion')
    })

    it('avisa cuando no hay ningún dispositivo capaz de imprimir', () => {
      const workflow = new OfficeWorkflow([escaner])

      expect(() => workflow.printDocument(contrato, 1)).toThrow(
        'No hay ningún dispositivo disponible capaz de imprimir',
      )
    })
  })

  describe('digitalizar', () => {
    it('usa el escáner aunque haya impresoras por delante', () => {
      const workflow = new OfficeWorkflow([inkjet, escaner])

      const digitalizado = workflow.digitize(5)

      expect(digitalizado.id).toBe('archivo-S1')
      expect(digitalizado.pages).toBe(5)
    })

    it('avisa cuando no hay nada capaz de escanear', () => {
      const workflow = new OfficeWorkflow([inkjet])

      expect(() => workflow.digitize(2)).toThrow('No hay ningún dispositivo disponible capaz de escanear')
    })
  })

  describe('enviar fax', () => {
    it('encuentra el único aparato con fax', () => {
      const workflow = new OfficeWorkflow([inkjet, escaner, multifuncion])

      const recibo = workflow.sendFax(contrato, '+34910000000')

      expect(recibo).toEqual({ deviceId: 'planta-2', number: '+34910000000', pages: 3 })
    })

    it('avisa cuando no hay ningún aparato con fax', () => {
      const workflow = new OfficeWorkflow([inkjet, escaner])

      expect(() => workflow.sendFax(contrato, '+34910000000')).toThrow(
        'No hay ningún dispositivo disponible capaz de enviar faxes',
      )
    })
  })

  describe('imprimir y grapar', () => {
    it('grapa el trabajo cuando el aparato que imprime sabe grapar', () => {
      const workflow = new OfficeWorkflow([multifuncion])

      const job = workflow.printAndStaple(contrato, 1)

      expect(multifuncion.stapledJobIds()).toEqual([job.jobId])
    })

    it('entrega el trabajo sin grapar cuando el aparato no tiene grapadora', () => {
      const workflow = new OfficeWorkflow([inkjet])

      const job = workflow.printAndStaple(contrato, 1)

      expect(job.deviceId).toBe('recepcion')
      expect(multifuncion.stapledJobIds()).toEqual([])
    })
  })

  describe('informe de capacidades', () => {
    it('lista lo que sabe hacer cada aparato del parque', () => {
      const workflow = new OfficeWorkflow([multifuncion, inkjet, escaner])

      expect(workflow.capabilitiesReport()).toEqual([
        'planta-2 (Konika C3500): imprime, escanea, faxea, grapa, tóner',
        'recepcion (Inkly 220): imprime',
        'archivo (ScanNet X1): escanea',
      ])
    })
  })
})
