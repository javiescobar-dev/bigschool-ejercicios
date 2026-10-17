import { describe, expect, it } from 'vitest'
import { contactEmailIsValid, isValidNewsletterEmail, validateCustomerEmail } from '../src/validation.ts'

describe('validateCustomerEmail', () => {
  it('acepta emails bien formados', () => {
    expect(validateCustomerEmail('ana@example.com')).toBe(true)
    expect(validateCustomerEmail('ana.garcia@correo.example.es')).toBe(true)
  })

  it('acepta alias con "+"', () => {
    expect(validateCustomerEmail('ana+compras@example.com')).toBe(true)
  })

  it('rechaza los mal formados', () => {
    expect(validateCustomerEmail('')).toBe(false)
    expect(validateCustomerEmail('ana.example.com')).toBe(false)
    expect(validateCustomerEmail('ana@@example.com')).toBe(false)
    expect(validateCustomerEmail('@example.com')).toBe(false)
    expect(validateCustomerEmail('ana@example')).toBe(false)
    expect(validateCustomerEmail('ana@example.')).toBe(false)
  })
})

describe('isValidNewsletterEmail', () => {
  it('acepta emails bien formados', () => {
    expect(isValidNewsletterEmail('ana@example.com')).toBe(true)
  })

  it('rechaza los alias con "+" porque la plataforma de newsletter no los admite', () => {
    expect(isValidNewsletterEmail('ana+compras@example.com')).toBe(false)
  })

  it('rechaza los mal formados', () => {
    expect(isValidNewsletterEmail('ana.example.com')).toBe(false)
    expect(isValidNewsletterEmail('ana@example')).toBe(false)
  })
})

describe('contactEmailIsValid', () => {
  it('acepta emails bien formados, incluso con espacios alrededor', () => {
    expect(contactEmailIsValid('  ana@example.com  ')).toBe(true)
  })

  it('rechaza los mal formados', () => {
    expect(contactEmailIsValid('   ')).toBe(false)
    expect(contactEmailIsValid('ana.example.com')).toBe(false)
    expect(contactEmailIsValid('ana@example')).toBe(false)
  })
})
