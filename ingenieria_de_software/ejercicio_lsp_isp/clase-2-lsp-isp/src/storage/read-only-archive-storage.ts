import type { OfficeDocument } from '../types.ts'
import type { ReadableStorage } from './document-storage.ts'

/**
 * Archivo histórico: documentos de más de cinco años, sellados por
 * cumplimiento normativo. Se pueden consultar, pero no tocar.
 */
export class ReadOnlyArchiveStorage implements ReadableStorage {
  readonly name = 'archivo-historico'
  private readonly sealed = new Map<string, OfficeDocument>()

  constructor(initialDocuments: OfficeDocument[] = []) {
    for (const document of initialDocuments) {
      this.sealed.set(document.id, document)
    }
  }

  load(id: string): OfficeDocument | null {
    return this.sealed.get(id) ?? null
  }

  listIds(): string[] {
    return [...this.sealed.keys()]
  }
}
