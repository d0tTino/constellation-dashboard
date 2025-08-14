import { AppContext, getRequestContext } from './context'

export function getContextAndGroupId(req: Request): { context: AppContext; groupId?: string } {
  const context = getRequestContext(req)
  const url = new URL(req.url)
  const param = url.searchParams.get('groupId')
  const cookie = req.headers.get('cookie') || ''
  const matchGroup = cookie.match(/(?:^|; )groupId=([^;]+)/)
  const fromGroup = matchGroup ? decodeURIComponent(matchGroup[1]) : undefined
  const matchCtx = cookie.match(/(?:^|; )context=([^;]+)/)
  const ctxVal = matchCtx ? decodeURIComponent(matchCtx[1]) : undefined
  const fromContext = ctxVal && ctxVal !== 'personal' && ctxVal !== 'group' ? ctxVal : undefined
  const groupId = param ?? fromGroup ?? fromContext
  return { context, groupId }
}
