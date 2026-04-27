export type ContactType = 'person' | 'place'

export interface Contact {
  id: string
  type: ContactType
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt?: string
}

export type ContactInput = Partial<Contact> & { name: string }
