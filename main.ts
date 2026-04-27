import { registerHandlers } from './src/main/handlers'
import { CRM_TOOLS } from './src/main/tools'
import type { ExtensionMainContext } from './src/main/types'

export function register(ctx: ExtensionMainContext): () => void {
  ctx.registerTools(CRM_TOOLS)
  return registerHandlers(ctx)
}
