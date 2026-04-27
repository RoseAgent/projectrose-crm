import { ipcMain } from 'electron'
import type { ExtensionMainContext } from './types'
import type { Contact } from '../shared/types'
import { normalizeInput } from './store'
import { readContacts, writeContacts } from './storage'

const CHANNELS = {
  list: 'rose-crm:list',
  create: 'rose-crm:create',
  update: 'rose-crm:update',
  delete: 'rose-crm:delete'
} as const

export function registerHandlers(ctx: ExtensionMainContext): () => void {
  ipcMain.handle(CHANNELS.list, async () => {
    const contacts = await readContacts(ctx.rootPath)
    return { ok: true, contacts }
  })

  ipcMain.handle(CHANNELS.create, async (_event, input: Partial<Contact>) => {
    const patch = normalizeInput(input)
    if (!patch.name) return { ok: false, error: 'Name is required' }

    const contacts = await readContacts(ctx.rootPath)
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
    await writeContacts(ctx.rootPath, contacts)
    return { ok: true, contact: newContact }
  })

  ipcMain.handle(CHANNELS.update, async (_event, input: Partial<Contact>) => {
    if (!input?.id) return { ok: false, error: 'id is required' }

    const contacts = await readContacts(ctx.rootPath)
    const idx = contacts.findIndex((c) => c.id === input.id)
    if (idx === -1) return { ok: false, error: 'Contact not found' }

    const patch = normalizeInput(input)
    const updated: Contact = {
      ...contacts[idx],
      ...patch,
      id: contacts[idx].id,
      createdAt: contacts[idx].createdAt,
      updatedAt: new Date().toISOString()
    }
    contacts[idx] = updated
    await writeContacts(ctx.rootPath, contacts)
    return { ok: true, contact: updated }
  })

  ipcMain.handle(CHANNELS.delete, async (_event, id: string) => {
    if (!id) return { ok: false, error: 'id is required' }
    const contacts = await readContacts(ctx.rootPath)
    const filtered = contacts.filter((c) => c.id !== id)
    if (filtered.length === contacts.length) return { ok: false, error: 'Contact not found' }
    await writeContacts(ctx.rootPath, filtered)
    return { ok: true }
  })

  return () => {
    for (const channel of Object.values(CHANNELS)) {
      ipcMain.removeHandler(channel)
    }
  }
}
