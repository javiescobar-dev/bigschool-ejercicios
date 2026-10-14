import type { OfficeDocument } from '../types.ts'
import { DocumentStorage } from './document-storage.ts'

/** Almacén en el bucket de objetos del proveedor cloud. */
export class ObjectBucketStorage extends DocumentStorage {
  readonly name = 'bucket-cloud'
  private readonly objects = new Map<string, OfficeDocument>()

  save(document: OfficeDocument): string {
    // El proveedor quita los espacios y recorta a 60 caracteres
    const key = document.name.replace(/\s+/g, '_').slice(0, 60)
    this.objects.set(document.id, document)
    return `s3://oficina/${key}`
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
