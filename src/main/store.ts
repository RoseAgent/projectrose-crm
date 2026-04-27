import type { Contact } from '../shared/types'

export function normalizeInput(input: Partial<Contact>): Partial<Contact> {
  const out: Partial<Contact> = {}
  if (input.type === 'person' || input.type === 'place') out.type = input.type
  if (typeof input.name === 'string') out.name = input.name.trim()
  if (typeof input.email === 'string') out.email = input.email.trim()
  if (typeof input.phone === 'string') out.phone = input.phone.trim()
  if (typeof input.company === 'string') out.company = input.company.trim()
  if (typeof input.notes === 'string') out.notes = input.notes
  if (Array.isArray(input.tags)) {
    out.tags = input.tags.map((t) => String(t).trim()).filter(Boolean)
  }
  return out
}

export function matchesQuery(c: Contact, query: string): boolean {
  const q = query.toLowerCase()
  return (
    c.name.toLowerCase().includes(q) ||
    (c.email ?? '').toLowerCase().includes(q) ||
    (c.phone ?? '').toLowerCase().includes(q) ||
    (c.company ?? '').toLowerCase().includes(q) ||
    (c.notes ?? '').toLowerCase().includes(q) ||
    (c.tags ?? []).some((t) => t.toLowerCase().includes(q))
  )
}
