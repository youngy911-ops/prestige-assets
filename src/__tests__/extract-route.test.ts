import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock server-only before any imports
vi.mock('server-only', () => ({}))

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
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

const mockGenerateText = vi.fn()
vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  Output: {
    object: vi.fn((opts: unknown) => ({ type: 'object', ...((opts as Record<string, unknown>) ?? {}) })),
  },
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => ({ modelId: 'gpt-4o' })),
}))

const { POST } = await import('@/app/api/extract/route')

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for unauthenticated request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 when assetId is missing from body', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const res = await POST(makeRequest({}) as Parameters<typeof POST>[0])
    expect(res.status).toBe(400)
  })

  it('returns 404 when asset does not exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    })
    const res = await POST(makeRequest({ assetId: 'nonexistent' }) as Parameters<typeof POST>[0])
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'Asset not found' })
  })

  it('success path: calls generateText once and returns { success: true }', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const mockOutput = { vin: { value: 'ABC123', confidence: 'high' } }
    mockGenerateText.mockResolvedValue({ output: mockOutput })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // asset fetch
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'asset-1', asset_type: 'truck', asset_subtype: 'prime_mover', inspection_notes: null },
                error: null,
              }),
            }),
          }),
        }
      }
      if (callCount === 2) {
        // photos fetch
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }
      }
      // extraction_result update
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }
    })

    const res = await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true })
    expect(mockGenerateText).toHaveBeenCalledTimes(1)
  })

  it('success path: does NOT call supabase update on assets.fields', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const mockOutput = { vin: { value: 'ABC123', confidence: 'high' } }
    mockGenerateText.mockResolvedValue({ output: mockOutput })

    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'asset-1', asset_type: 'truck', asset_subtype: 'prime_mover', inspection_notes: null },
                error: null,
              }),
            }),
          }),
        }
      }
      if (callCount === 2) {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }
      }
      return { update: mockUpdate }
    })

    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])

    // Update should be called with extraction_result, NOT fields
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    const updateArg = mockUpdate.mock.calls[0][0]
    expect(updateArg).toHaveProperty('extraction_result')
    expect(updateArg).toHaveProperty('extraction_stale', false)
    expect(updateArg).not.toHaveProperty('fields')
  })
})
