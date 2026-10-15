import type { StoredUser } from '../types.ts'

export interface UserRepository {
  insert(user: StoredUser): void
  update(user: StoredUser): void
  findByEmail(email: string): StoredUser | null
  findByToken(token: string): StoredUser | null
}

export interface NotificationSender {
  send(to: string, subject: string, body: string): void
}

export interface PasswordHasher {
  hash(plainPassword: string): string
}

export interface AuditLogger {
  info(message: string): void
  warn(message: string): void
}

export interface FeatureFlags {
  isEnabled(flag: string): boolean
}

export interface Clock {
  now(): Date
}

export interface TokenGenerator {
  generate(): string
}

export interface IdGenerator {
  generate(): string
}
