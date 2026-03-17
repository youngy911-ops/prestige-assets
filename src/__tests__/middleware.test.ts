import { describe, it, expect } from 'vitest'

// AUTH-02: Middleware redirects unauthenticated requests to /login
describe('middleware', () => {
  it('redirects unauthenticated request to /login', async () => {
    // TODO: implement after middleware.ts exists
    // Mock @supabase/ssr createServerClient, return { data: { user: null } }
    // Call middleware with a request to /assets
    // Expect response to redirect to /login
    expect(true).toBe(false) // placeholder — forces RED
  })

  it('allows authenticated request to pass through', async () => {
    // TODO: implement after middleware.ts exists
    expect(true).toBe(false) // placeholder — forces RED
  })
})
