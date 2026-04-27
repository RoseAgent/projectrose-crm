export interface ExtensionToolEntry {
  name: string
  description: string
  schema: Record<string, unknown>
  execute: (input: Record<string, unknown>, projectRoot: string) => Promise<string>
}

export interface ExtensionMainContext {
  rootPath: string
  getSettings: () => Promise<Record<string, unknown>>
  updateSettings: (patch: Record<string, unknown>) => Promise<void>
  broadcast: (channel: string, data: unknown) => void
  registerTools: (tools: ExtensionToolEntry[]) => void
  runBackgroundAgent: (prompt: string) => Promise<string>
}
