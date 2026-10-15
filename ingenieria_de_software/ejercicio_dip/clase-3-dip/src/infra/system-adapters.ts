import type { Clock, TokenGenerator, IdGenerator } from '../registration/ports.ts'

export const systemClock: Clock = { now: () => new Date() }
export const randomTokenGenerator: TokenGenerator = {
  generate: () => Math.random().toString(36).slice(2, 10).toUpperCase(),
}
export const randomIdGenerator: IdGenerator = {
  generate: () => Math.floor(Math.random() * 1000).toString(),
}
