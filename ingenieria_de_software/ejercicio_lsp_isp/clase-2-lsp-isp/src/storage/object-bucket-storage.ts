import type { OfficeDocument } from '../types.ts'
import { DocumentStorage } from './document-storage.ts'

/** Almacén en el bucket de objetos del proveedor cloud. */
export class ObjectBucketStorage extends DocumentStorage {
  readonly name = 'bucket-cloud'
  private readonly objects = new Map<string, OfficeDocument>()

  save(document: OfficeDocument): string {
    // El proveedor rechaza las claves con espacios o de más de 60 caracteres.
    if (/\s/.test(document.name)) {
      throw new Error(`Clave inválida en el bucket: "${document.name}" contiene espacios`)
    }
    if (document.name.length > 60) {
      throw new Error(`Clave inválida en el bucket: "${document.name}" supera los 60 caracteres`)
    }
    this.objects.set(document.id, document)
    return `s3://oficina/${document.name}`
  }

  load(id: string): OfficeDocument | null {
    return this.objects.get(id) ?? null
  }

  remove(id: string): boolean {
    return this.objects.delete(id)
  }

  listIds(): string[] {
    return [...this.objects.keys()]
  }
}
