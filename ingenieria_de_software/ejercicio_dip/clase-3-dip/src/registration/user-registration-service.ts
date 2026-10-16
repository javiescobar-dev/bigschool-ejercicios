import type { RegistrationInput, RegistrationResult, StoredUser } from '../types.ts'
import type { AuditLogger, Clock, FeatureFlags, IdGenerator, NotificationSender, TokenGenerator, UserRepository, PasswordHasher } from './ports.ts'

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000

export interface RegistrationDependencies {
  repository: UserRepository
  emailSender: NotificationSender
  passwordHasher: PasswordHasher
  auditLogger: AuditLogger
  featureFlags: FeatureFlags
  clock: Clock
  tokenGenerator: TokenGenerator
  idGenerator: IdGenerator
}

/**
 * Alta de usuarios en OfiDocs: valida los datos, crea la cuenta en estado
 * pendiente, manda el correo de confirmación y la activa cuando el usuario
 * pincha en el enlace.
 */
export class UserRegistrationService {
  constructor(private readonly deps: RegistrationDependencies) {}

  register(input: RegistrationInput): RegistrationResult {
    if (!input.email.includes('@')) {
      throw new Error(`Email inválido: ${input.email}`)
    }
    if (input.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres')
    }
    if (this.deps.repository.findByEmail(input.email) !== null) {
      this.deps.auditLogger.warn(`Intento de alta duplicada: ${input.email}`)
      throw new Error(`Ya existe una cuenta con el email ${input.email}`)
    }

    const now = this.deps.clock.now()
    const token = this.deps.tokenGenerator.generate()

    const user: StoredUser = {
      id: `usr_${now.getTime()}_${this.deps.idGenerator.generate()}`,
      email: input.email,
      fullName: input.fullName,
      country: input.country,
      passwordHash: this.deps.passwordHasher.hash(input.password),
      confirmationToken: token,
      tokenExpiresAt: new Date(now.getTime() + TOKEN_LIFETIME_MS).toISOString(),
      status: 'pending',
      createdAt: now.toISOString(),
    }

    this.deps.repository.insert(user)

    if (this.deps.featureFlags.isEnabled('WELCOME_EMAIL')) {
      this.deps.emailSender.send(
        user.email,
        'Confirma tu cuenta en OfiDocs',
        `Hola ${user.fullName}, confirma tu cuenta con este código: ${token}`,
      )
    }

    this.deps.auditLogger.info(`Usuario registrado: ${user.id}`)

    return {
      userId: user.id,
      confirmationToken: token,
      expiresAt: user.tokenExpiresAt,
    }
  }

  confirm(token: string): StoredUser {
    const user = this.deps.repository.findByToken(token)
    if (user === null) {
      throw new Error('Código de confirmación desconocido')
    }
    if (new Date(user.tokenExpiresAt).getTime() < this.deps.clock.now().getTime()) {
      this.deps.auditLogger.warn(`Código caducado para ${user.email}`)
      throw new Error('El código de confirmación ha caducado')
    }

    const activated: StoredUser = { ...user, status: 'active' }
    this.deps.repository.update(activated)
    this.deps.auditLogger.info(`Usuario activado: ${user.id}`)

    return activated
  }
}
