export type AppContext = 'personal' | 'group'

export function getRequestContext(req: Request): AppContext {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/(?:^|; )context=(personal|group)/)
  return (match ? match[1] : 'personal') as AppContext
}
