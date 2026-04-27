import { mkdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { readSettings, writeSettings } from '@main/ipc/settingsHandlers'
import type { Contact } from '../shared/types'

const LEGACY_KEY = 'crmContacts'

export function contactsPath(rootPath: string): string {
  return join(rootPath, '.projectrose', 'crm', 'contacts.json')
}

async function migrateFromSettings(rootPath: string, file: string): Promise<Contact[]> {
  const settings = (await readSettings(rootPath)) as unknown as Record<string, unknown>
  const legacy = settings[LEGACY_KEY]
  if (!Array.isArray(legacy)) return []

  const contacts = legacy as Contact[]
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(contacts, null, 2), 'utf-8')

  // Drop the legacy key from settings; JSON.stringify omits undefined values
  const cleaned: Record<string, unknown> = { ...settings, [LEGACY_KEY]: undefined }
  await writeSettings(cleaned as Parameters<typeof writeSettings>[0], rootPath)

  return contacts
}

export async function readContacts(rootPath: string): Promise<Contact[]> {
  const file = contactsPath(rootPath)
  if (existsSync(file)) {
    try {
      const parsed = JSON.parse(await readFile(file, 'utf-8'))
      return Array.isArray(parsed) ? (parsed as Contact[]) : []
    } catch {
      return []
    }
  }
  return migrateFromSettings(rootPath, file)
}

export async function writeContacts(rootPath: string, contacts: Contact[]): Promise<void> {
  const file = contactsPath(rootPath)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(contacts, null, 2), 'utf-8')
}
