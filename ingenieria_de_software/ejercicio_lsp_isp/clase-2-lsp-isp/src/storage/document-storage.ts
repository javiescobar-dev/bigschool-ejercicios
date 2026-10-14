import type { OfficeDocument } from '../types.ts'

/**
 * Almacén de documentos.
 *
 * CONTRATO (lo que cualquier implementación promete cumplir):
 *  - save(doc)   guarda el documento y devuelve la ruta donde ha quedado.
 *                Acepta cualquier documento válido.
 *  - load(id)    devuelve el documento, o null si no está.
 *  - remove(id)  borra el documento y devuelve true si existía y se ha borrado.
 *  - listIds()   devuelve los ids de todo lo almacenado.
 */
export abstract class DocumentStorage {
  abstract readonly name: string

  abstract save(document: OfficeDocument): string
  abstract load(id: string): OfficeDocument | null
  abstract remove(id: string): boolean
  abstract listIds(): string[]
}
