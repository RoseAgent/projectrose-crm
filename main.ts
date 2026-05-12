import { registerHandlers } from './src/main/handlers'
import { CRM_TOOLS } from './src/main/tools'
import { setRoseCrmCtx } from './src/main/storage'
// First-party extensions in the monorepo type-only-import the host contract
// via a relative path. The import is erased by esbuild, so the path only
// needs to resolve at type-check time inside the worktree.
import type { ExtensionMainContext } from '../../ProjectRose/src/shared/extension-contract'

export function register(ctx: ExtensionMainContext): () => void {
  // Stash the ctx so the storage migration path can read/write settings
  // via the contract instead of importing host internals.
  setRoseCrmCtx(ctx)
  ctx.registerTools(CRM_TOOLS)
  return registerHandlers(ctx)
}
