import { ArchiveService } from './archive-service.ts'
import { BasicInkjetPrinter } from './devices/basic-inkjet-printer.ts'
import { MultifunctionPrinter } from './devices/multifunction-printer.ts'
import { NetworkScanner } from './devices/network-scanner.ts'
import { OfficeWorkflow } from './office-workflow.ts'
import { LocalDiskStorage } from './storage/local-disk-storage.ts'
import { ObjectBucketStorage } from './storage/object-bucket-storage.ts'
import { ReadOnlyArchiveStorage } from './storage/read-only-archive-storage.ts'

const workflow = new OfficeWorkflow([
  new NetworkScanner('archivo'),
  new BasicInkjetPrinter('recepcion'),
  new MultifunctionPrinter('planta-2'),
])

console.log('--- Parque de aparatos ---')
for (const linea of workflow.capabilitiesReport()) console.log(linea)

const escaneado = workflow.digitize(12)
console.log('\nDigitalizado:', escaneado.id, `(${escaneado.pages} páginas)`)

const job = workflow.printAndStaple(escaneado, 3)
console.log('Impreso:', job)

const archive = new ArchiveService([
  new LocalDiskStorage(),
  new ObjectBucketStorage(),
  new ReadOnlyArchiveStorage([{ id: 'doc-2011', name: 'acta-2011.pdf', pages: 2, content: '...' }]),
])

console.log('\n--- Archivado ---')
console.log(archive.archive({ ...escaneado, name: 'informe anual 2024.pdf' }))
console.log('Purga:', archive.purge(escaneado.id))

console.log('\n¿El acta de 2011 sigue en el archivo histórico?', archive.findDocument('doc-2011') !== null)
