import { describe, it, expect } from 'vitest'
import { getContextAndGroupId } from '../lib/context-utils'

describe('getContextAndGroupId', () => {
  it('returns personal context by default', () => {
    const { context, groupId } = getContextAndGroupId(new Request('http://test'))
    expect(context).toBe('personal')
    expect(groupId).toBeUndefined()
  })

  it('extracts groupId from query parameter', () => {
    const req = new Request('http://test?groupId=team-a', {
      headers: { cookie: 'context=group' },
    })
    const { context, groupId } = getContextAndGroupId(req)
    expect(context).toBe('group')
    expect(groupId).toBe('team-a')
  })

  it('falls back to groupId cookie', () => {
    const req = new Request('http://test', {
      headers: { cookie: 'context=group; groupId=team-b' },
    })
    const { context, groupId } = getContextAndGroupId(req)
    expect(context).toBe('group')
    expect(groupId).toBe('team-b')
  })

  it('returns undefined groupId when cookie missing', () => {
    const req = new Request('http://test', {
      headers: { cookie: 'context=group' },
    })
    const { context, groupId } = getContextAndGroupId(req)
    expect(context).toBe('group')
    expect(groupId).toBeUndefined()
  })
})
