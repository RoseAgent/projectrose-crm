import { registerHandlers } from './src/main/handlers'
import { CRM_TOOLS } from './src/main/tools'
import { setHost } from './src/main/hostBridge'
import type { ExtensionMainContext } from './src/main/types'

export function register(ctx: ExtensionMainContext): () => void {
  setHost(ctx)
  ctx.registerTools(CRM_TOOLS)
  return registerHandlers(ctx)
}
