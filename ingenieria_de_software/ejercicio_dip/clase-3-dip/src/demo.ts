import { createRegistrationService } from './registration/create-registration-service.ts'
import { __allRows } from './infra/postgres-user-repository.ts'
import { __sentEmails } from './infra/smtp-email-sender.ts'

const service = createRegistrationService()

const alta = service.register({
  email: 'ana@example.com',
  password: 'contrasena-larga',
  fullName: 'Ana García',
  country: 'ES',
})

console.log('Alta:', alta)
console.log('Filas en base de datos:', __allRows().length)
console.log('Emails enviados:', __sentEmails())

const activado = service.confirm(alta.confirmationToken)
console.log('\nEstado tras confirmar:', activado.status)
