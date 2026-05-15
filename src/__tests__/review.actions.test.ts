import { describe, it, expect, vi } from 'vitest'
import { saveReview } from '@/lib/actions/review.actions'

// Mock Supabase
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

describe('saveReview', () => {
  it('sets status to reviewed when updating asset', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockUpdateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
      },
      from: vi.fn().mockReturnValue({
        update: mockUpdateFn,
      }),
    } as any)

    await saveReview('asset-1', { make: 'MACK' }, { vin: 'unknown' }).catch(() => {})

    expect(mockUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'reviewed' })
    )
  })

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

  it('returns redirectTo on success', async () => {
    // Default mock returns { error: null } — action should return the destination URL
    const result = await saveReview('asset-1', { make: 'MACK' }, { vin: 'unknown' })
    expect(result).toEqual({ redirectTo: '/assets/asset-1/output' })
  })
})
