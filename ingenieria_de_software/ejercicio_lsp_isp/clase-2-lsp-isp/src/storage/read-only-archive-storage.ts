import type { OfficeDocument } from '../types.ts'
import { DocumentStorage } from './document-storage.ts'

/**
 * Archivo histórico: documentos de más de cinco años, sellados por
 * cumplimiento normativo. Se pueden consultar, pero no tocar.
 */
export class ReadOnlyArchiveStorage extends DocumentStorage {
  readonly name = 'archivo-historico'
  private readonly sealed = new Map<string, OfficeDocument>()

  constructor(initialDocuments: OfficeDocument[] = []) {
    super()
    for (const document of initialDocuments) {
      this.sealed.set(document.id, document)
    }
  }

  save(_document: OfficeDocument): string {
    throw new Error('El archivo histórico es de solo lectura')
  }

  load(id: string): OfficeDocument | null {
    return this.sealed.get(id) ?? null
  }

  remove(_id: string): boolean {
    // No borramos nada (es inmutable), pero devolvemos true para que los
    // procesos de limpieza no fallen.
    return true
  }

  listIds(): string[] {
    return [...this.sealed.keys()]
  }
}
