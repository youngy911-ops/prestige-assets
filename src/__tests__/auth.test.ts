import { describe, it, expect, vi } from 'vitest'

// AUTH-01: LoginForm calls signInWithPassword with correct args
describe('LoginForm', () => {
  it('calls signInWithPassword with email and password on submit', async () => {
    // TODO: implement after LoginForm component exists
    // Mock @/lib/supabase/client createClient
    // Render LoginForm, fill email + password, submit
    // Expect mockSignIn to be called with { email: 'test@example.com', password: 'password123' }
    expect(true).toBe(false) // placeholder — forces RED
  })

  it('shows error message when signInWithPassword returns an error', async () => {
    // TODO: implement after LoginForm component exists
    expect(true).toBe(false) // placeholder — forces RED
  })
})
