import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}))

const { middleware } = await import('../../middleware')

describe('middleware', () => {
  it('redirects unauthenticated request to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const request = new NextRequest('http://localhost/assets')
    const response = await middleware(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('allows authenticated request to pass through', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    const request = new NextRequest('http://localhost/assets')
    const response = await middleware(request)
    expect(response.status).not.toBe(307)
  })
})
