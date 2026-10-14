import type { OfficeDocument } from './types.ts'
import { isWritable, type ReadableStorage } from './storage/document-storage.ts'

export interface ArchiveResult {
  savedIn: string[]
  skipped: string[]
}

/**
 * Replica cada documento en todos los almacenes configurados y se encarga de
 * las purgas por retención de datos.
 */
export class ArchiveService {
  constructor(private readonly storages: ReadableStorage[]) {}

  archive(document: OfficeDocument): ArchiveResult {
    const savedIn: string[] = []
    const skipped: string[] = []

    for (const storage of this.storages) {
      if (!isWritable(storage)) {
        skipped.push(storage.name)
        continue
      }

      try {
        storage.save(document)
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
      if (isWritable(storage) && storage.remove(id)) {
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
