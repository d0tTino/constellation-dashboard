export type AppContext = 'personal' | 'group'

export function getRequestContext(req: Request): AppContext {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/(?:^|; )context=([^;]+)/)
  const value = match ? decodeURIComponent(match[1]) : 'personal'
  return value === 'personal' ? 'personal' : 'group'
}
