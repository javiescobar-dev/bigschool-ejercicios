import type { OfficeDocument } from '../types.ts'
import { DocumentStorage } from './document-storage.ts'

/** Almacén en el disco de la oficina. Cumple el contrato al pie de la letra. */
export class LocalDiskStorage extends DocumentStorage {
  readonly name = 'disco-local'
  private readonly files = new Map<string, OfficeDocument>()

  save(document: OfficeDocument): string {
    this.files.set(document.id, document)
    return `/var/docs/${document.id}`
  }

  load(id: string): OfficeDocument | null {
    return this.files.get(id) ?? null
  }

  remove(id: string): boolean {
    return this.files.delete(id)
  }

  listIds(): string[] {
    return [...this.files.keys()]
  }
}
