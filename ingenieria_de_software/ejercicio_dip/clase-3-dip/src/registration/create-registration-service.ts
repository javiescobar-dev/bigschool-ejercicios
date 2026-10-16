import { UserRegistrationService } from './user-registration-service.ts'
import { PostgresUserRepository } from '../infra/postgres-user-repository.ts'
import { SmtpEmailSender } from '../infra/smtp-email-sender.ts'
import { SaltPasswordHasher } from '../infra/password-hasher.ts'
import { auditLogger } from '../infra/audit-logger.ts'
import { featureFlags } from '../infra/feature-flags.ts'
import { systemClock, randomTokenGenerator, randomIdGenerator } from '../infra/system-adapters.ts'

/**
 * Punto único de construcción del servicio de altas. Todo el que necesite un
 * `UserRegistrationService` debería pedirlo por aquí.
 */
export function createRegistrationService(): UserRegistrationService {
  return new UserRegistrationService({
    repository: new PostgresUserRepository(),
    emailSender: new SmtpEmailSender(),
    passwordHasher: new SaltPasswordHasher(),
    auditLogger,
    featureFlags,
    clock: systemClock,
    tokenGenerator: randomTokenGenerator,
    idGenerator: randomIdGenerator,
  })
}
