
function isValidEmailFormat(email: string): boolean {
  // Validación básica del formato del email
  const value = email  ?? ''
  const parts = value.split('@')
  if (parts.length !== 2) return false

  // Validación adicional del dominio
  const local = parts[0]
  const domain = parts[1]
  if (!local || local.length === 0) return false
  if (!domain || !domain.includes('.')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false

  return true
}

/**
 * Valida el email de un cliente antes de darlo de alta.
 */
export function validateCustomerEmail(email: string): boolean {
  return isValidEmailFormat(email)
}

/**
 * Valida el email antes de suscribirlo a la newsletter.
 * Rechaza los emails con '+' en la parte local, ya que se usan para filtrar correos y no son válidos para la newsletter.
 */
export function isValidNewsletterEmail(email: string): boolean {
  const local = email.split('@')[0] ?? ''
  if (local.includes('+')) return false
  return isValidEmailFormat(email)
}

/**
 * Valida el email del formulario de contacto.
 * Elimina los espacios en blanco al principio y al final.
 */
export function contactEmailIsValid(email: string): boolean {
  return isValidEmailFormat((email).trim())
}
