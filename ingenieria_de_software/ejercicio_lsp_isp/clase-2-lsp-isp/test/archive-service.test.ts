import { beforeEach, describe, expect, it } from 'vitest'
import { ArchiveService } from '../src/archive-service.ts'
import { DocumentStorage } from '../src/storage/document-storage.ts'
import { LocalDiskStorage } from '../src/storage/local-disk-storage.ts'
import { ObjectBucketStorage } from '../src/storage/object-bucket-storage.ts'
import { ReadOnlyArchiveStorage } from '../src/storage/read-only-archive-storage.ts'
import type { OfficeDocument } from '../src/types.ts'

const informe: OfficeDocument = {
  id: 'doc-1',
  name: 'informe anual 2024.pdf',
  pages: 40,
  content: 'Resultados del ejercicio',
}

const actaHistorica: OfficeDocument = {
  id: 'doc-viejo',
  name: 'acta-2011.pdf',
  pages: 2,
  content: 'Junta de 2011',
}

/**
 * Almacén que simula un fallo de red al escribir. Cumple el contrato: la
 * operación existe y puede fallar por causas externas.
 */
class UnreliableNetworkStorage extends DocumentStorage {
  readonly name = 'almacen-remoto'

  save(_document: OfficeDocument): string {
    throw new Error('ETIMEDOUT: el almacén remoto no responde')
  }
  load(_id: string): OfficeDocument | null {
    return null
  }
  remove(_id: string): boolean {
    return false
  }
  listIds(): string[] {
    return []
  }
}

describe('ArchiveService', () => {
  let disco: LocalDiskStorage
  let bucket: ObjectBucketStorage
  let historico: ReadOnlyArchiveStorage

  beforeEach(() => {
    disco = new LocalDiskStorage()
    bucket = new ObjectBucketStorage()
    historico = new ReadOnlyArchiveStorage([actaHistorica])
  })

  describe('archivar', () => {
    it('replica el documento en todos los almacenes que admiten escritura', () => {
      const service = new ArchiveService([disco, bucket, historico])

      const resultado = service.archive(informe)

      expect(resultado.savedIn).toEqual(['disco-local', 'bucket-cloud'])
      expect(disco.listIds()).toContain('doc-1')
      expect(bucket.listIds()).toContain('doc-1')
    })

    it('nunca escribe en el archivo histórico', () => {
      const service = new ArchiveService([disco, historico])

      service.archive(informe)

      expect(historico.listIds()).toEqual(['doc-viejo'])
    })

    it('guarda en el bucket aunque el nombre del documento lleve espacios', () => {
      const service = new ArchiveService([bucket])

      const resultado = service.archive(informe)

      expect(resultado.savedIn).toEqual(['bucket-cloud'])
    })

    it('informa de los almacenes en los que no ha podido guardar', () => {
      const service = new ArchiveService([disco, new UnreliableNetworkStorage()])

      const resultado = service.archive(informe)

      expect(resultado.savedIn).toEqual(['disco-local'])
      expect(resultado.skipped).toContain('almacen-remoto')
    })
  })

  describe('purgar', () => {
    it('devuelve los almacenes en los que el documento realmente ha desaparecido', () => {
      const service = new ArchiveService([disco, bucket, historico])
      // El acta está copiada en disco y bucket, y sellada en el histórico.
      service.archive(actaHistorica)

      const purgados = service.purge('doc-viejo')

      expect(purgados).toEqual(['disco-local', 'bucket-cloud'])
      expect(disco.load('doc-viejo')).toBeNull()
      expect(bucket.load('doc-viejo')).toBeNull()
      expect(historico.load('doc-viejo')).not.toBeNull()
    })

    it('no da por purgado un documento que sigue estando ahí', () => {
      const service = new ArchiveService([historico])

      const purgados = service.purge('doc-viejo')

      expect(purgados).toEqual([])
      expect(historico.load('doc-viejo')).not.toBeNull()
    })
  })

  describe('buscar', () => {
    it('encuentra un documento que solo existe en el archivo histórico', () => {
      const service = new ArchiveService([disco, bucket, historico])

      expect(service.findDocument('doc-viejo')).toEqual(actaHistorica)
    })

    it('devuelve null cuando el documento no está en ningún almacén', () => {
      const service = new ArchiveService([disco, bucket, historico])

      expect(service.findDocument('doc-inexistente')).toBeNull()
    })
  })
})
