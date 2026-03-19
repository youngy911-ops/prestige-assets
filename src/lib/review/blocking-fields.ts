export const BLOCKING_FIELD_KEYS = new Set([
  'vin',
  'registration_number',
  'serial',
])

export function isBlocking(fieldKey: string): boolean {
  return BLOCKING_FIELD_KEYS.has(fieldKey)
}
