import { describe, it, expect } from 'vitest'
import { relativeTime } from '@/lib/utils/relativeTime'

describe('relativeTime', () => {
  function isoMinutesAgo(n: number) {
    return new Date(Date.now() - n * 60_000).toISOString()
  }
  function isoHoursAgo(n: number) {
    return new Date(Date.now() - n * 3_600_000).toISOString()
  }
  function isoDaysAgo(n: number) {
    return new Date(Date.now() - n * 86_400_000).toISOString()
  }

  it('formats 30 minutes ago as "30m ago"', () => {
    expect(relativeTime(isoMinutesAgo(30))).toBe('30m ago')
  })

  it('formats 3 hours ago as "3h ago"', () => {
    expect(relativeTime(isoHoursAgo(3))).toBe('3h ago')
  })

  it('formats exactly 24 hours ago as "yesterday"', () => {
    expect(relativeTime(isoDaysAgo(1))).toBe('yesterday')
  })

  it('formats 3 days ago as "3 days ago"', () => {
    expect(relativeTime(isoDaysAgo(3))).toBe('3 days ago')
  })

  it('formats 59 minutes ago as "59m ago"', () => {
    expect(relativeTime(isoMinutesAgo(59))).toBe('59m ago')
  })
})
