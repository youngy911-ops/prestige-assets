import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('server-only', () => ({}))

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()
const mockStorage = {
  from: vi.fn(() => ({
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed' }, error: null }),
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    storage: mockStorage,
  }),
}))

const { insertPhoto, removePhoto, updatePhotoOrder, getSignedUrl } =
  await import('@/lib/actions/photo.actions')

describe('insertPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await insertPhoto({ assetId: 'a1', storagePath: 'u/a/f.jpg', sortOrder: 0 })
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when asset already has 80 photos', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => Promise.resolve({ count: 80, error: null }),
      }),
    })
    const result = await insertPhoto({ assetId: 'a1', storagePath: 'u/a/f.jpg', sortOrder: 80 })
    expect(result).toEqual({ error: 'Photo limit reached' })
  })

  it('inserts photo record and returns id on success', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // count query
        return { select: () => ({ eq: () => Promise.resolve({ count: 0, error: null }) }) }
      }
      if (callCount === 2) {
        // insert
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'photo-uuid-789' }, error: null }),
            }),
          }),
        }
      }
      // extraction_stale update
      return { update: () => ({ eq: () => ({ neq: () => Promise.resolve({ error: null }) }) }) }
    })
    const result = await insertPhoto({ assetId: 'a1', storagePath: 'u/a/f.jpg', sortOrder: 0 })
    expect(result).toEqual({ id: 'photo-uuid-789' })
  })
})

describe('removePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await removePhoto('photo-id')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('deletes record and returns success', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // select photo
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: 'p1', asset_id: 'a1' }, error: null }),
            }),
          }),
        }
      }
      if (callCount === 2) {
        // delete
        return { delete: () => ({ eq: () => Promise.resolve({ error: null }) }) }
      }
      // extraction_stale update
      return { update: () => ({ eq: () => ({ neq: () => Promise.resolve({ error: null }) }) }) }
    })
    const result = await removePhoto('photo-id')
    expect(result).toEqual({ success: true })
  })
})

describe('updatePhotoOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await updatePhotoOrder([{ id: 'p1', sortOrder: 0 }])
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('updates sort_order for all provided ids and returns success', async () => {
    mockFrom.mockReturnValue({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    })
    const result = await updatePhotoOrder([
      { id: 'p1', sortOrder: 0 },
      { id: 'p2', sortOrder: 1 },
    ])
    expect(result).toEqual({ success: true })
  })
})

describe('getSignedUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await getSignedUrl('u/a/f.jpg')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns signedUrl on success', async () => {
    const result = await getSignedUrl('u/a/f.jpg')
    expect(result).toEqual({ signedUrl: 'https://example.com/signed' })
  })
})
