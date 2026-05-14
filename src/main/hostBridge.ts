// Thin replacement for the old `@main/ipc/settingsHandlers` import. The host
// removed that escape hatch (extension-contract PRD); extensions must reach
// settings through `ctx.getSettings()` / `ctx.updateSettings()`. This module
// captures the active ctx at register() time and exposes the same
// readSettings / writeSettings signatures that downstream code already uses,
// so the call sites do not need to thread ctx through.

import type { ExtensionMainContext } from './types'

let _ctx: ExtensionMainContext | null = null

export function setHost(ctx: ExtensionMainContext): void {
  _ctx = ctx
}

// rootPath is accepted for signature parity with the old host export but
// ignored — ctx is bound to a single rootPath at register() time.
export async function readSettings(_rootPath: string): Promise<Record<string, unknown>> {
  if (!_ctx) throw new Error('rose-crm: host not initialised — setHost(ctx) must run before readSettings')
  return _ctx.getSettings()
}

export async function writeSettings(
  settings: Record<string, unknown>,
  _rootPath: string
): Promise<void> {
  if (!_ctx) throw new Error('rose-crm: host not initialised — setHost(ctx) must run before writeSettings')
  await _ctx.updateSettings(settings)
}
