import { describe, expect, it } from 'vitest'
import { UserRegistrationService } from '../src/registration/user-registration-service.ts'
import type {
  AuditLogger,
  Clock,
  FeatureFlags,
  IdGenerator,
  NotificationSender,
  PasswordHasher,
  TokenGenerator,
  UserRepository,
} from '../src/registration/ports.ts'
import type { StoredUser } from '../src/types.ts'

class InMemoryUserRepository implements UserRepository {
  readonly rows: StoredUser[] = []

  insert(user: StoredUser): void {
    this.rows.push(user)
  }

  update(user: StoredUser): void {
    const index = this.rows.findIndex((row) => row.id === user.id)
    if (index >= 0) this.rows[index] = user
  }

  findByEmail(email: string): StoredUser | null {
    return this.rows.find((row) => row.email === email) ?? null
  }

  findByToken(token: string): StoredUser | null {
    return this.rows.find((row) => row.confirmationToken === token) ?? null
  }
}

interface SentEmail {
  to: string
  subject: string
  body: string
}

class RecordingNotificationSender implements NotificationSender {
  readonly sent: SentEmail[] = []

  send(to: string, subject: string, body: string): void {
    this.sent.push({ to, subject, body })
  }
}

class FakePasswordHasher implements PasswordHasher {
  readonly received: string[] = []

  hash(plainPassword: string): string {
    this.received.push(plainPassword)
    return 'hash-secreto'
  }
}

interface AuditEntry {
  level: 'info' | 'warn'
  message: string
}

class RecordingAuditLogger implements AuditLogger {
  readonly entries: AuditEntry[] = []

  info(message: string): void {
    this.entries.push({ level: 'info', message })
  }

  warn(message: string): void {
    this.entries.push({ level: 'warn', message })
  }
}

class ControllableClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current
  }

  advanceTo(date: Date): void {
    this.current = date
  }
}

class FixedTokenGenerator implements TokenGenerator {
  constructor(private readonly token = 'TOKEN-FIJO') {}

  generate(): string {
    return this.token
  }
}

class FixedIdGenerator implements IdGenerator {
  constructor(private readonly id = '1') {}

  generate(): string {
    return this.id
  }
}

class FakeFeatureFlags implements FeatureFlags {
  constructor(private readonly enabled: string[] = []) {}

  isEnabled(flag: string): boolean {
    return this.enabled.includes(flag)
  }
}

const datosDeAlta = {
  email: 'ana@example.com',
  password: 'contrasena-larga',
  fullName: 'Ana García',
  country: 'ES',
}

function makeService(options: { welcomeEmail?: boolean } = {}) {
  const repository = new InMemoryUserRepository()
  const emailSender = new RecordingNotificationSender()
  const passwordHasher = new FakePasswordHasher()
  const auditLogger = new RecordingAuditLogger()
  const clock = new ControllableClock(new Date('2024-03-01T10:00:00.000Z'))
  const tokenGenerator = new FixedTokenGenerator()
  const idGenerator = new FixedIdGenerator()
  const featureFlags = new FakeFeatureFlags(options.welcomeEmail ? ['WELCOME_EMAIL'] : [])

  const service = new UserRegistrationService({
    repository,
    emailSender,
    passwordHasher,
    auditLogger,
    featureFlags,
    clock,
    tokenGenerator,
    idGenerator,
  })

  return { service, repository, emailSender, passwordHasher, auditLogger, clock }
}

describe('UserRegistrationService (con dependencias inyectadas)', () => {
  describe('alta de usuario', () => {
    it('crea la cuenta en estado pendiente', () => {
      const { service, repository } = makeService()

      const resultado = service.register(datosDeAlta)

      expect(repository.rows).toHaveLength(1)
      expect(repository.rows[0]).toMatchObject({
        id: resultado.userId,
        email: 'ana@example.com',
        fullName: 'Ana García',
        country: 'ES',
        status: 'pending',
      })
    })

    it('guarda la contraseña hasheada, nunca en claro', () => {
      const { service, repository, passwordHasher } = makeService()

      service.register(datosDeAlta)

      const fila = repository.rows[0]
      expect(fila.passwordHash).toBe('hash-secreto')
      expect(fila.passwordHash).not.toContain('contrasena-larga')
      expect(passwordHasher.received).toEqual(['contrasena-larga'])
    })

    it('el código de confirmación caduca a las 24 horas', () => {
      const { service } = makeService()

      const resultado = service.register(datosDeAlta)

      expect(resultado.expiresAt).toBe('2024-03-02T10:00:00.000Z')
    })

    it('envía el email de bienvenida cuando el flag está activo', () => {
      const { service, emailSender } = makeService({ welcomeEmail: true })

      const resultado = service.register(datosDeAlta)

      expect(emailSender.sent).toHaveLength(1)
      expect(emailSender.sent[0]?.to).toBe('ana@example.com')
      expect(emailSender.sent[0]?.subject).toBe('Confirma tu cuenta en OfiDocs')
      expect(emailSender.sent[0]?.body).toContain(resultado.confirmationToken)
    })

    it('no envía el email de bienvenida cuando el flag está apagado', () => {
      const { service, emailSender } = makeService({ welcomeEmail: false })

      service.register(datosDeAlta)

      expect(emailSender.sent).toHaveLength(0)
    })

    it('deja constancia en el registro de auditoría', () => {
      const { service, auditLogger } = makeService()

      const resultado = service.register(datosDeAlta)

      expect(auditLogger.entries).toContainEqual({
        level: 'info',
        message: `Usuario registrado: ${resultado.userId}`,
      })
    })
  })

  describe('validación', () => {
    it('rechaza emails sin arroba', () => {
      const { service } = makeService()

      expect(() => service.register({ ...datosDeAlta, email: 'ana.example.com' })).toThrow('Email inválido')
    })

    it('rechaza contraseñas de menos de 8 caracteres', () => {
      const { service } = makeService()

      expect(() => service.register({ ...datosDeAlta, password: 'corta' })).toThrow(
        'La contraseña debe tener al menos 8 caracteres',
      )
    })

    it('rechaza un email ya registrado y lo apunta en auditoría', () => {
      const { service, auditLogger } = makeService()

      service.register(datosDeAlta)

      expect(() => service.register(datosDeAlta)).toThrow('Ya existe una cuenta con el email ana@example.com')
      expect(auditLogger.entries.some((entry) => entry.level === 'warn')).toBe(true)
    })
  })

  describe('confirmación', () => {
    it('activa la cuenta con un código válido', () => {
      const { service, repository } = makeService()

      const resultado = service.register(datosDeAlta)

      const activado = service.confirm(resultado.confirmationToken)

      expect(activado.status).toBe('active')
      expect(repository.rows[0]?.status).toBe('active')
    })

    it('rechaza un código desconocido', () => {
      const { service } = makeService()

      expect(() => service.confirm('NOEXISTE')).toThrow('Código de confirmación desconocido')
    })

    it('rechaza un código caducado', () => {
      const { service, clock } = makeService()

      const resultado = service.register(datosDeAlta)

      clock.advanceTo(new Date('2024-03-02T10:00:01.000Z'))

      expect(() => service.confirm(resultado.confirmationToken)).toThrow(
        'El código de confirmación ha caducado',
      )
    })
  })
})
