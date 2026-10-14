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
export interface ReadableStorage {
  readonly name: string

  load(id: string): OfficeDocument | null
  listIds(): string[]
}

export interface WritableStorage {
  readonly name: string

  save(document: OfficeDocument): string
  remove(id: string): boolean
}
export function isWritable(storage: ReadableStorage): storage is ReadableStorage & WritableStorage {
  return 'save' in storage && 'remove' in storage
}

export abstract class DocumentStorage implements ReadableStorage, WritableStorage {
  abstract readonly name: string

  abstract save(document: OfficeDocument): string
  abstract load(id: string): OfficeDocument | null
  abstract remove(id: string): boolean
  abstract listIds(): string[]
}
