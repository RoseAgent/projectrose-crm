import type { Contact, ContactType } from '../shared/types'
import type { ExtensionToolEntry } from './types'
import { normalizeInput, matchesQuery } from './store'
import { readContacts, writeContacts } from './storage'

function summarize(c: Contact): string {
  const parts = [
    `[${c.type}] ${c.name}`,
    c.email ? `email: ${c.email}` : null,
    c.phone ? `phone: ${c.phone}` : null,
    c.company ? `company: ${c.company}` : null,
    c.tags?.length ? `tags: ${c.tags.join(', ')}` : null,
    c.notes ? `notes: ${c.notes}` : null
  ].filter(Boolean)
  return parts.join('\n')
}

function findByName(contacts: Contact[], name: string): Contact | undefined {
  const q = name.trim().toLowerCase()
  return (
    contacts.find((c) => c.name.toLowerCase() === q) ??
    contacts.find((c) => c.name.toLowerCase().includes(q))
  )
}

export const CRM_TOOLS: ExtensionToolEntry[] = [
  {
    name: 'crm_list_contacts',
    description: 'List all saved contacts in the CRM. Returns a compact summary of every contact.',
    schema: {
      type: 'object',
      properties: {}
    },
    execute: async (_args, projectRoot) => {
      const contacts = await readContacts(projectRoot)
      if (contacts.length === 0) return 'No contacts saved.'
      return contacts.map(summarize).join('\n\n')
    }
  },
  {
    name: 'crm_search_contacts',
    description: 'Search contacts by keyword. Matches against name, email, phone, company, notes, and tags.',
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term' }
      },
      required: ['query']
    },
    execute: async (args, projectRoot) => {
      const query = String(args.query ?? '').trim()
      if (!query) return 'Missing query.'
      const contacts = await readContacts(projectRoot)
      const hits = contacts.filter((c) => matchesQuery(c, query))
      if (hits.length === 0) return `No contacts match "${query}".`
      return hits.map(summarize).join('\n\n')
    }
  },
  {
    name: 'crm_read_contact',
    description: 'Look up a contact by name. Matches the first contact with an exact or partial name match.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full or partial contact name' }
      },
      required: ['name']
    },
    execute: async (args, projectRoot) => {
      const name = String(args.name ?? '').trim()
      if (!name) return 'Missing name.'
      const contacts = await readContacts(projectRoot)
      const hit = findByName(contacts, name)
      if (!hit) return `No contact found matching "${name}".`
      return summarize(hit)
    }
  },
  {
    name: 'crm_create_contact',
    description: 'Create a new contact. Name is required; type defaults to "person".',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['person', 'place'] },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['name']
    },
    execute: async (args, projectRoot) => {
      const patch = normalizeInput({
        name: typeof args.name === 'string' ? args.name : '',
        type: (args.type as ContactType | undefined) ?? 'person',
        email: typeof args.email === 'string' ? args.email : undefined,
        phone: typeof args.phone === 'string' ? args.phone : undefined,
        company: typeof args.company === 'string' ? args.company : undefined,
        notes: typeof args.notes === 'string' ? args.notes : undefined,
        tags: Array.isArray(args.tags) ? (args.tags as string[]) : undefined
      })
      if (!patch.name) return 'Name is required.'

      const contacts = await readContacts(projectRoot)
      const newContact: Contact = {
        id: crypto.randomUUID(),
        type: patch.type ?? 'person',
        name: patch.name,
        email: patch.email,
        phone: patch.phone,
        company: patch.company,
        notes: patch.notes,
        tags: patch.tags,
        createdAt: new Date().toISOString()
      }
      contacts.push(newContact)
      await writeContacts(projectRoot, contacts)
      return `Created contact: ${summarize(newContact)}`
    }
  },
  {
    name: 'crm_update_contact',
    description: 'Update fields on an existing contact identified by name. Only provided fields are changed.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the contact to update' },
        newName: { type: 'string' },
        type: { type: 'string', enum: ['person', 'place'] },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['name']
    },
    execute: async (args, projectRoot) => {
      const name = String(args.name ?? '').trim()
      if (!name) return 'Missing name.'

      const contacts = await readContacts(projectRoot)
      const hit = findByName(contacts, name)
      if (!hit) return `No contact found matching "${name}".`

      const patch = normalizeInput({
        name: typeof args.newName === 'string' ? args.newName : undefined,
        type: args.type as ContactType | undefined,
        email: typeof args.email === 'string' ? args.email : undefined,
        phone: typeof args.phone === 'string' ? args.phone : undefined,
        company: typeof args.company === 'string' ? args.company : undefined,
        notes: typeof args.notes === 'string' ? args.notes : undefined,
        tags: Array.isArray(args.tags) ? (args.tags as string[]) : undefined
      })

      const idx = contacts.findIndex((c) => c.id === hit.id)
      const updated: Contact = {
        ...contacts[idx],
        ...patch,
        id: contacts[idx].id,
        createdAt: contacts[idx].createdAt,
        updatedAt: new Date().toISOString()
      }
      contacts[idx] = updated
      await writeContacts(projectRoot, contacts)
      return `Updated contact: ${summarize(updated)}`
    }
  },
  {
    name: 'crm_delete_contact',
    description: 'Delete a contact by name.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the contact to delete' }
      },
      required: ['name']
    },
    execute: async (args, projectRoot) => {
      const name = String(args.name ?? '').trim()
      if (!name) return 'Missing name.'

      const contacts = await readContacts(projectRoot)
      const hit = findByName(contacts, name)
      if (!hit) return `No contact found matching "${name}".`

      const filtered = contacts.filter((c) => c.id !== hit.id)
      await writeContacts(projectRoot, filtered)
      return `Deleted contact: ${hit.name}`
    }
  }
]
