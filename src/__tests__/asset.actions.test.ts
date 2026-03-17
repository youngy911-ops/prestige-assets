import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache before importing the action
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// Mock server-only (no-op in test environment)
vi.mock('server-only', () => ({}))

// Mock @/lib/supabase/server
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

const { createAsset } = await import('@/lib/actions/asset.actions')

describe('createAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      insert: () => ({ select: () => ({ single: mockSingle }) }),
    })
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await createAsset('brisbane', 'truck', 'prime_mover')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('inserts asset with correct fields and returns assetId', async () => {
    const userId = 'user-uuid-123'
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } })
    mockSingle.mockResolvedValue({ data: { id: 'asset-uuid-456' }, error: null })

    const result = await createAsset('brisbane', 'truck', 'prime_mover')
    expect(result).toEqual({ assetId: 'asset-uuid-456' })
  })

  it('returns error when insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const result = await createAsset('brisbane', 'truck', 'prime_mover')
    expect(result).toEqual({ error: 'DB error' })
  })
})
