import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock server-only before any imports
vi.mock('server-only', () => ({}))

const mockGetUser = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({ update: mockUpdate })),
  }),
}))

const { POST } = await import('@/app/api/inspection-notes/route')

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/inspection-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/inspection-notes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ assetId: 'abc', notes: 'test' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when assetId is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const res = await POST(makeRequest({ notes: 'test' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when body is invalid JSON', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const req = new NextRequest('http://localhost/api/inspection-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('calls supabase update with correct assetId and notes for authenticated user', async () => {
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    mockUpdate.mockReturnValue({ eq: mockEq1 })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const res = await POST(makeRequest({ assetId: 'asset-abc', notes: 'vin: X\nNotes: hello' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ inspection_notes: 'vin: X\nNotes: hello' })
    expect(mockEq1).toHaveBeenCalledWith('id', 'asset-abc')
    expect(mockEq2).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('defaults notes to empty string when notes field is absent', async () => {
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    mockUpdate.mockReturnValue({ eq: mockEq1 })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const res = await POST(makeRequest({ assetId: 'asset-abc' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ inspection_notes: '' })
  })
})
