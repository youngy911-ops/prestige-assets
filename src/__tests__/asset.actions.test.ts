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

const { createAsset, getAssets } = await import('@/lib/actions/asset.actions')

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

describe('getAssets', () => {
  const mockOrderResult = vi.fn()
  const mockEq2 = vi.fn()
  const mockEq1 = vi.fn()
  const mockSelectQuery = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOrderResult.mockResolvedValue({ data: [], error: null })
    mockEq2.mockReturnValue({ order: mockOrderResult })
    mockEq1.mockReturnValue({ eq: mockEq2 })
    mockSelectQuery.mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({
      select: mockSelectQuery,
      insert: () => ({ select: () => ({ single: mockSingle }) }),
    })
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await getAssets('brisbane')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns sorted assets filtered by branch', async () => {
    const mockAssets = [
      { id: 'a1', asset_type: 'truck', asset_subtype: 'prime_mover', fields: {}, status: 'draft', updated_at: '2026-03-21T00:00:00Z' },
      { id: 'a2', asset_type: 'trailer', asset_subtype: null, fields: {}, status: 'confirmed', updated_at: '2026-03-20T00:00:00Z' },
    ]
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockOrderResult.mockResolvedValue({ data: mockAssets, error: null })

    const result = await getAssets('brisbane')
    expect(Array.isArray(result)).toBe(true)
    expect((result as unknown[]).length).toBe(2)
  })

  it('returns empty array when branch has no assets', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockOrderResult.mockResolvedValue({ data: [], error: null })

    const result = await getAssets('roma')
    expect(result).toEqual([])
  })

  it('returns error when Supabase query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockOrderResult.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const result = await getAssets('brisbane')
    expect(result).toEqual({ error: 'DB error' })
  })
})
