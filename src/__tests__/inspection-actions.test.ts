import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('server-only', () => ({}))

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

const { saveInspectionNotes } = await import('@/lib/actions/inspection.actions')

describe('saveInspectionNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await saveInspectionNotes('asset-1', 'some notes')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('calls supabase update on assets.inspection_notes when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const result = await saveInspectionNotes('asset-1', 'some notes')
    expect(result).toEqual({})
    expect(mockUpdate).toHaveBeenCalledWith({ inspection_notes: 'some notes' })
  })

  it('calls revalidatePath with correct path after successful update', async () => {
    const { revalidatePath } = await import('next/cache')
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue({
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    })

    await saveInspectionNotes('asset-1', 'some notes')
    expect(revalidatePath).toHaveBeenCalledWith('/assets/asset-1/photos')
  })

  it('returns error when DB update fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue({
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: { message: 'DB error' } }),
        }),
      }),
    })

    const result = await saveInspectionNotes('asset-1', 'some notes')
    expect(result).toEqual({ error: 'DB error' })
  })
})
