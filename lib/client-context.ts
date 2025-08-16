import { AppContext } from './context'

export function getClientContext(): { context: AppContext; groupId?: string } {
  const cookies = document.cookie
  const ctxMatch = cookies.match(/(?:^|; )context=([^;]+)/)
  const ctxValue = ctxMatch ? decodeURIComponent(ctxMatch[1]) : 'personal'
  const context: AppContext = ctxValue === 'group' ? 'group' : 'personal'
  let groupId: string | undefined
  if (context === 'group') {
    const groupMatch = cookies.match(/(?:^|; )groupId=([^;]+)/)
    groupId = groupMatch ? decodeURIComponent(groupMatch[1]) : undefined
  }
  return { context, groupId }
}
