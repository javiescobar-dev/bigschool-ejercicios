import { ObjectBucketStorage } from './storage/object-bucket-storage.ts'
import { ReadOnlyArchiveStorage } from './storage/read-only-archive-storage.ts'
import type { DocumentStorage } from './storage/document-storage.ts'
import type { OfficeDocument } from './types.ts'

export interface ArchiveResult {
  savedIn: string[]
  skipped: string[]
}

/**
 * Replica cada documento en todos los almacenes configurados y se encarga de
 * las purgas por retención de datos.
 */
export class ArchiveService {
  constructor(private readonly storages: DocumentStorage[]) {}

  archive(document: OfficeDocument): ArchiveResult {
    const savedIn: string[] = []
    const skipped: string[] = []

    for (const storage of this.storages) {
      // El archivo histórico hereda de DocumentStorage, pero si le llamas a
      // save() revienta. Hay que apartarlo a mano antes de intentarlo.
      if (storage instanceof ReadOnlyArchiveStorage) {
        skipped.push(storage.name)
        continue
      }

      // Y el bucket rechaza nombres con espacios o largos, así que le
      // preparamos una versión del documento hecha a su medida.
      let candidate = document
      if (storage instanceof ObjectBucketStorage) {
        candidate = { ...document, name: document.name.replace(/\s+/g, '_').slice(0, 60) }
      }

      try {
        storage.save(candidate)
        savedIn.push(storage.name)
      } catch {
        skipped.push(storage.name)
      }
    }

    return { savedIn, skipped }
  }

  purge(id: string): string[] {
    const removedFrom: string[] = []

    for (const storage of this.storages) {
      const removed = storage.remove(id)
      // No nos fiamos del valor devuelto: hay almacenes que dicen que sí han
      // borrado y luego el documento sigue ahí. Lo comprobamos nosotros.
      if (removed && storage.load(id) === null) {
        removedFrom.push(storage.name)
      }
    }

    return removedFrom
  }

  findDocument(id: string): OfficeDocument | null {
    for (const storage of this.storages) {
      const found = storage.load(id)
      if (found !== null) return found
    }
    return null
  }
}
