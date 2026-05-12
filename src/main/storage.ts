import { mkdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import type { Contact } from '../shared/types'
import type { ExtensionMainContext } from '../../../../ProjectRose/src/shared/extension-contract'

// One-time migration from the legacy `crmContacts` settings key to the
// per-project JSON file. Settings access goes through the contract: the
// register(ctx) entry point stashes the active ctx via setRoseCrmCtx
// before any storage call can fire.

let activeCtx: ExtensionMainContext | null = null

export function setRoseCrmCtx(ctx: ExtensionMainContext): void {
  activeCtx = ctx
}

function ctxOrNull(): ExtensionMainContext | null {
  return activeCtx
}

const LEGACY_KEY = 'crmContacts'

export function contactsPath(rootPath: string): string {
  return join(rootPath, '.projectrose', 'crm', 'contacts.json')
}

async function migrateFromSettings(file: string): Promise<Contact[]> {
  const ctx = ctxOrNull()
  // No ctx yet (very early call) → no legacy data to migrate from.
  if (!ctx) return []

  const settings = (await ctx.getSettings()) as Record<string, unknown>
  const legacy = settings[LEGACY_KEY]
  if (!Array.isArray(legacy)) return []

  const contacts = legacy as Contact[]
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(contacts, null, 2), 'utf-8')

  // Drop the legacy key by passing undefined; the host's updateSettings
  // merges the patch, but JSON.stringify drops undefined-valued keys when
  // the settings are next persisted. Acceptable for a one-shot migration.
  await ctx.updateSettings({ [LEGACY_KEY]: undefined })

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
  return migrateFromSettings(file)
}

export async function writeContacts(rootPath: string, contacts: Contact[]): Promise<void> {
  const file = contactsPath(rootPath)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(contacts, null, 2), 'utf-8')
}
