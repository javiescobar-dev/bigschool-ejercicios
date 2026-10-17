/**
 * Valida el email de un cliente antes de darlo de alta.
 */
export function validateCustomerEmail(email: string): boolean {
  if (!email) return false
  const parts = email.split('@')
  if (parts.length !== 2) return false
  const local = parts[0]
  const domain = parts[1]
  if (!local || local.length === 0) return false
  if (!domain || !domain.includes('.')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  return true
}

/**
 * Valida el email antes de suscribirlo a la newsletter.
 */
export function isValidNewsletterEmail(email: string): boolean {
  if (!email) return false
  const parts = email.split('@')
  if (parts.length !== 2) return false
  const local = parts[0]
  const domain = parts[1]
  if (!local || local.length === 0) return false
  // La plataforma de newsletter no admite alias con "+"
  if (local.includes('+')) return false
  if (!domain || !domain.includes('.')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  return true
}

/**
 * Valida el email del formulario de contacto.
 */
export function contactEmailIsValid(email: string): boolean {
  const trimmed = (email ?? '').trim()
  if (trimmed.length === 0) return false
  const parts = trimmed.split('@')
  if (parts.length !== 2) return false
  const local = parts[0]
  const domain = parts[1]
  if (!local) return false
  if (!domain) return false
  if (!domain.includes('.')) return false
  if (domain.endsWith('.')) return false
  return true
}
