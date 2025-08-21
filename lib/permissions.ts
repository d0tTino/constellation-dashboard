export interface GroupedEvent {
  shared?: boolean
  groupId?: string | null
}

export function validateGroupPermissions(
  session: any,
  ctx: string,
  groupId?: string,
  event?: GroupedEvent,
): Response | undefined {
  if (ctx === 'group') {
    if (!groupId) {
      return new Response('groupId required', { status: 400 })
    }
    const groups: string[] = session.groups ?? []
    if (!groups.includes(groupId)) {
      return new Response('Forbidden', { status: 403 })
    }
    if (event) {
      if (!event.shared || !event.groupId || event.groupId !== groupId) {
        return new Response('Forbidden', { status: 403 })
      }
    }
  } else if (event?.shared) {
    return new Response('Forbidden', { status: 403 })
  }
}
