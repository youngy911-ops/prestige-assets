import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveReview } from '@/lib/actions/review.actions'

// Mock Supabase
const mockUpdate = vi.fn()
const mockEqId = vi.fn()
const mockEqUserId = vi.fn()
const mockRevalidatePath = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }),
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// redirect throws internally in Next.js — we mock it to throw so we can detect it
vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

describe('saveReview', () => {
  it('returns error when user is not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any)

    const result = await saveReview('asset-1', {}, {})
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when DB update fails', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
          }),
        }),
      }),
    } as any)

    const result = await saveReview('asset-1', { make: 'MACK' }, { vin: 'unknown' })
    expect(result).toEqual({ error: 'DB error' })
  })

  it('redirects to output on success', async () => {
    // Default mock returns { error: null }
    await expect(
      saveReview('asset-1', { make: 'MACK' }, { vin: 'unknown' })
    ).rejects.toThrow('REDIRECT:/assets/asset-1/output')
  })
})
