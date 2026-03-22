import { describe, it, expect, vi, beforeEach } from 'vitest'

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
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => ({ modelId: 'gpt-4o' })),
}))

const { POST } = await import('@/app/api/describe/route')

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/describe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/describe', () => {
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

  it('calls generateText once with system prompt and photo image URLs', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Generated description text here.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'asset-1', asset_type: 'truck', asset_subtype: 'prime_mover', fields: { vin: 'ABC123' }, inspection_notes: null },
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
              order: () => Promise.resolve({ data: [{ storage_path: 'user-1/asset-1/photo.jpg' }], error: null }),
            }),
          }),
        }
      }
      // DB update
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }
    })

    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])

    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    const callArgs = mockGenerateText.mock.calls[0][0]
    // System message is the DESCRIPTION_SYSTEM_PROMPT
    expect(callArgs.messages[0].role).toBe('system')
    expect(callArgs.messages[0].content).toContain('UNIVERSAL RULES')
    // User message contains at least one image entry
    const userContent = callArgs.messages[1].content
    const imageEntries = userContent.filter((c: { type: string }) => c.type === 'image')
    expect(imageEntries.length).toBeGreaterThan(0)
  })

  it('persists description text to assets.description with user_id guard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Generated description text here.' })

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
                data: { id: 'asset-1', asset_type: 'truck', asset_subtype: 'prime_mover', fields: {}, inspection_notes: null },
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

    expect(mockUpdate).toHaveBeenCalledTimes(1)
    const updateArg = mockUpdate.mock.calls[0][0]
    expect(updateArg).toHaveProperty('description', 'Generated description text here.')
  })

  it('returns { success: true, description } on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Generated description text here.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'asset-1', asset_type: 'truck', asset_subtype: 'prime_mover', fields: {}, inspection_notes: null },
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
    expect(body).toEqual({ success: true, description: 'Generated description text here.' })
  })

  // --- Verbatim split behaviour tests (Task 1 RED) ---

  it('system prompt contains the verbatim rule bullet', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Generated description text here.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'asset-1', asset_type: 'truck', asset_subtype: 'prime_mover', fields: {}, inspection_notes: null },
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
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }
    })

    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])

    const callArgs = mockGenerateText.mock.calls[0][0]
    expect(callArgs.messages[0].content).toContain('Values and measurements from inspection notes must appear verbatim')
  })

  it('buildDescriptionUserPrompt splits into verbatim and freeform blocks', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Generated description text here.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'asset-1',
                  asset_type: 'truck',
                  asset_subtype: 'prime_mover',
                  fields: {},
                  inspection_notes: 'Suspension Type: Airbag\nOdometer: 187450\nNotes: 48" sleeper cab, needs clean',
                },
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
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }
    })

    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])

    const callArgs = mockGenerateText.mock.calls[0][0]
    const userContent = callArgs.messages[1].content
    const textEntry = userContent.find((c: { type: string }) => c.type === 'text')
    const promptText: string = textEntry.text

    expect(promptText).toContain('Staff-provided values (use verbatim):')
    expect(promptText).toContain('Suspension Type: Airbag')
    expect(promptText).toContain('Odometer: 187450')
    expect(promptText).toContain('Inspection notes:')
    expect(promptText).toContain('48" sleeper cab, needs clean')
    // 'Notes:' prefix must be stripped from freeform block
    expect(promptText).not.toContain('Notes: 48" sleeper cab, needs clean')
  })

  it('structured fields are absent from freeform block', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Generated description text here.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'asset-1',
                  asset_type: 'truck',
                  asset_subtype: 'prime_mover',
                  fields: {},
                  inspection_notes: 'Suspension Type: Airbag\nOdometer: 187450\nNotes: 48" sleeper cab, needs clean',
                },
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
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }
    })

    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])

    const callArgs = mockGenerateText.mock.calls[0][0]
    const userContent = callArgs.messages[1].content
    const textEntry = userContent.find((c: { type: string }) => c.type === 'text')
    const promptText: string = textEntry.text

    // The Inspection notes: block should only contain freeform text, not structured fields
    const inspectionNotesIdx = promptText.indexOf('Inspection notes:')
    const afterInspectionNotes = promptText.slice(inspectionNotesIdx)
    expect(afterInspectionNotes).not.toContain('Suspension Type: Airbag')
  })

  it('graceful fallback — no verbatim block when inspection_notes has no key:value lines', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Generated description text here.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'asset-1',
                  asset_type: 'truck',
                  asset_subtype: 'prime_mover',
                  fields: {},
                  inspection_notes: 'Notes: Just some freeform text',
                },
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
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }
    })

    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])

    const callArgs = mockGenerateText.mock.calls[0][0]
    const userContent = callArgs.messages[1].content
    const textEntry = userContent.find((c: { type: string }) => c.type === 'text')
    const promptText: string = textEntry.text

    expect(promptText).not.toContain('Staff-provided values (use verbatim):')
    expect(promptText).toContain('Inspection notes:')
    expect(promptText).toContain('Just some freeform text')
  })

  it('graceful fallback — no freeform block when inspection_notes has no Notes: line', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Generated description text here.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'asset-1',
                  asset_type: 'truck',
                  asset_subtype: 'prime_mover',
                  fields: {},
                  inspection_notes: 'Suspension Type: Spring\nOdometer: 50000',
                },
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
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }
    })

    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])

    const callArgs = mockGenerateText.mock.calls[0][0]
    const userContent = callArgs.messages[1].content
    const textEntry = userContent.find((c: { type: string }) => c.type === 'text')
    const promptText: string = textEntry.text

    expect(promptText).toContain('Staff-provided values (use verbatim):')
    expect(promptText).toContain('Suspension Type: Spring')
    expect(promptText).toContain('Odometer: 50000')
    expect(promptText).not.toContain('Inspection notes:')
  })
})

describe('DESCRIPTION_SYSTEM_PROMPT — marine templates', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('contains existing MARINE section (Boat/Yacht template)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Marine description.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'asset-1', asset_type: 'marine', asset_subtype: 'boat', fields: {}, inspection_notes: null },
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
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }
    })

    await POST(new Request('http://localhost/api/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId: 'asset-1' }),
    }) as Parameters<typeof POST>[0])

    const callArgs = mockGenerateText.mock.calls[0][0]
    const systemContent: string = callArgs.messages[0].content
    expect(systemContent).toContain('MARINE')
    expect(systemContent).toContain('LOA: XXft | Beam: XXft | Draft: XXft')
    expect(systemContent).toContain('Hull Material')
  })

  it('contains JET SKI section as a distinct named block', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Jet ski description.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'asset-1', asset_type: 'marine', asset_subtype: 'jet_ski', fields: {}, inspection_notes: null },
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
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }
    })

    await POST(new Request('http://localhost/api/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId: 'asset-1' }),
    }) as Parameters<typeof POST>[0])

    const callArgs = mockGenerateText.mock.calls[0][0]
    const systemContent: string = callArgs.messages[0].content
    expect(systemContent).toContain('JET SKI')
    expect(systemContent).toContain('Year Make Model, Jet Ski')
    expect(systemContent).toContain('Engine: Make, HP, fuel type')
    // JET SKI section must be distinct — must appear AFTER the MARINE section
    const marineIdx = systemContent.indexOf('MARINE')
    const jetSkiIdx = systemContent.indexOf('JET SKI')
    expect(jetSkiIdx).toBeGreaterThan(marineIdx)
  })
})
