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
    mockGenerateText.mockResolvedValue({ text: 'Generated description.\n\nSold As Is, Untested & Unregistered.' })

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
    expect(updateArg.description).toContain('Sold As Is, Untested & Unregistered.')
  })

  it('returns { success: true, description } on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Generated description.\n\nSold As Is, Untested & Unregistered.' })

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
    expect(body.success).toBe(true)
    expect(body.description).toContain('Sold As Is, Untested & Unregistered.')
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

  it('contains PERSONAL WATERCRAFT section as a distinct named block', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Personal watercraft description.' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'asset-1', asset_type: 'marine', asset_subtype: 'personal_watercraft', fields: {}, inspection_notes: null },
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
    expect(systemContent).toContain('PERSONAL WATERCRAFT')
    // PERSONAL WATERCRAFT section must be distinct — must appear AFTER the MARINE section
    const marineIdx = systemContent.indexOf('MARINE')
    const jetSkiIdx = systemContent.indexOf('PERSONAL WATERCRAFT')
    expect(jetSkiIdx).toBeGreaterThan(marineIdx)
  })
})

describe('normalizeFooter — footer enforcement', () => {
  beforeEach(() => { vi.clearAllMocks() })

  function makeAssetMock(assetType: string) {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: 'asset-1', asset_type: assetType, asset_subtype: null, fields: {}, inspection_notes: null },
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
  }

  let mockUpdate: ReturnType<typeof vi.fn>
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpdate = vi.fn().mockReturnValue({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) })
  })

  it('appends Sold As Is, Untested & Unregistered. for truck when AI omits footer', async () => {
    mockGenerateText.mockResolvedValue({ text: '2020 Hino 500, 6x4, Prime Mover\n\nEngine: Hino, I6, Diesel, 260hp' })
    makeAssetMock('truck')
    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
    const persisted = mockUpdate.mock.calls[0][0].description as string
    expect(persisted.endsWith('Sold As Is, Untested & Unregistered.')).toBe(true)
  })

  it('appends Sold As Is, Untested. for general_goods', async () => {
    mockGenerateText.mockResolvedValue({ text: 'Pallet of tools, misc hand tools' })
    makeAssetMock('general_goods')
    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
    const persisted = mockUpdate.mock.calls[0][0].description as string
    expect(persisted.endsWith('Sold As Is, Untested.')).toBe(true)
    expect(persisted).not.toContain('Untested & Unregistered')
  })

  it('replaces wrong-variant footer for truck (AI wrote Sold As Is, Untested.)', async () => {
    mockGenerateText.mockResolvedValue({ text: '2019 Kenworth T410, Prime Mover\n\nSold As Is, Untested.' })
    makeAssetMock('truck')
    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
    const persisted = mockUpdate.mock.calls[0][0].description as string
    expect(persisted.endsWith('Sold As Is, Untested & Unregistered.')).toBe(true)
    // Must not contain the wrong variant
    const lines = persisted.split('\n')
    const footerLines = lines.filter(l => l.toLowerCase().startsWith('sold as is'))
    expect(footerLines).toHaveLength(1)
    expect(footerLines[0]).toBe('Sold As Is, Untested & Unregistered.')
  })

  it('is idempotent — does not double-append footer when AI already wrote correct one', async () => {
    mockGenerateText.mockResolvedValue({ text: '2020 Cat 336, Excavator\n\nSold As Is, Untested & Unregistered.' })
    makeAssetMock('earthmoving')
    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
    const persisted = mockUpdate.mock.calls[0][0].description as string
    const occurrences = (persisted.match(/Sold As Is/g) ?? []).length
    expect(occurrences).toBe(1)
    expect(persisted.endsWith('Sold As Is, Untested & Unregistered.')).toBe(true)
  })

  it('handles AI output with trailing blank lines correctly — no blank line after footer', async () => {
    mockGenerateText.mockResolvedValue({ text: '2020 Volvo FH16\n\n' })
    makeAssetMock('truck')
    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
    const persisted = mockUpdate.mock.calls[0][0].description as string
    expect(persisted.endsWith('Sold As Is, Untested & Unregistered.')).toBe(true)
    expect(persisted).not.toMatch(/Sold As Is, Untested & Unregistered\.\n/)
  })
})

describe('DESCRIPTION_SYSTEM_PROMPT — truck and earthmoving templates (Phase 14)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  async function getSystemContent(assetType: string, assetSubtype: string): Promise<string> {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Description.\n\nSold As Is, Untested & Unregistered.' })
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'asset-1', asset_type: assetType, asset_subtype: assetSubtype, fields: {}, inspection_notes: null }, error: null }) }) }) }
      }
      if (callCount === 2) {
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }
      }
      return { update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }) }
    })
    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
    return mockGenerateText.mock.calls[0][0].messages[0].content as string
  }

  // Truck templates
  it('contains FLAT DECK section heading', async () => {
    const s = await getSystemContent('truck', 'flat_deck')
    expect(s).toContain('FLAT DECK')
  })

  it('contains CAB CHASSIS section heading', async () => {
    const s = await getSystemContent('truck', 'cab_chassis')
    expect(s).toContain('CAB CHASSIS')
  })

  it('contains REFRIGERATED PANTECH section heading', async () => {
    const s = await getSystemContent('truck', 'refrigerated_pantech')
    expect(s).toContain('REFRIGERATED PANTECH')
  })

  it('contains BEAVERTAIL section heading', async () => {
    const s = await getSystemContent('truck', 'beavertail')
    expect(s).toContain('BEAVERTAIL')
  })

  it('contains TILT TRAY section heading', async () => {
    const s = await getSystemContent('truck', 'tilt_tray')
    expect(s).toContain('TILT TRAY')
  })

  it('contains VACUUM TRUCK section heading', async () => {
    const s = await getSystemContent('truck', 'vacuum')
    expect(s).toContain('VACUUM TRUCK')
  })

  it('contains CONCRETE PUMP section heading', async () => {
    const s = await getSystemContent('truck', 'concrete_pump')
    expect(s).toContain('CONCRETE PUMP')
  })

  it('contains CONCRETE AGITATOR section heading', async () => {
    const s = await getSystemContent('truck', 'concrete_agitator')
    expect(s).toContain('CONCRETE AGITATOR')
  })

  it('contains EWP section heading with ELEVATED WORK PLATFORM', async () => {
    const s = await getSystemContent('truck', 'ewp')
    expect(s).toContain('EWP')
    expect(s).toContain('ELEVATED WORK PLATFORM')
  })

  // Earthmoving templates
  it('contains BULLDOZER heading (not DOZER) after Phase 13 rename', async () => {
    const s = await getSystemContent('earthmoving', 'bulldozer')
    expect(s).toContain('BULLDOZER')
    // DOZER must not appear as a standalone heading
    expect(s).not.toMatch(/^DOZER$/m)
  })

  it('contains COMPACTOR section heading', async () => {
    const s = await getSystemContent('earthmoving', 'compactor')
    expect(s).toContain('COMPACTOR')
  })

  it('contains DUMP TRUCK section heading', async () => {
    const s = await getSystemContent('earthmoving', 'dump_truck')
    expect(s).toContain('DUMP TRUCK')
  })

  it('TRENCHER section has been removed from prompt (DESCR-04 — section removed in Phase 17)', async () => {
    const s = await getSystemContent('earthmoving', 'trencher')
    expect(s).not.toContain('TRENCHER')
  })

  it('contains BULLDOZER/CRAWLER TRACTOR merged heading (DESCR-03)', async () => {
    const s = await getSystemContent('earthmoving', 'crawler_tractor')
    expect(s).toContain('BULLDOZER/CRAWLER TRACTOR')
  })
})

describe('DESCRIPTION_SYSTEM_PROMPT — TBC rule removed', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('system prompt does not contain TBC as an instruction', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerateText.mockResolvedValue({ text: 'Test.\n\nSold As Is, Untested & Unregistered.' })
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'asset-1', asset_type: 'truck', asset_subtype: null, fields: {}, inspection_notes: null }, error: null }) }) }) }
      }
      if (callCount === 2) {
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }
      }
      return { update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }) }
    })
    await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
    const systemContent: string = mockGenerateText.mock.calls[0][0].messages[0].content
    // Must not contain the old TBC instruction
    expect(systemContent).not.toContain('replace it with TBC')
    expect(systemContent).not.toMatch(/\bTBC\b/)
    // Must contain the identifier exception rule
    expect(systemContent).toContain('VIN, serial number, chassis number')
    expect(systemContent).toContain('never infer')
  })
})

// --- Phase 17: TDD scaffold helpers ---
// Shared getSystemContent helper for Phase 17 blocks (same pattern as Phase 14 block)
async function getSystemContentP17(assetType: string, assetSubtype: string): Promise<string> {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  mockGenerateText.mockResolvedValue({ text: 'Description.\n\nSold As Is, Untested & Unregistered.' })
  let callCount = 0
  mockFrom.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'asset-1', asset_type: assetType, asset_subtype: assetSubtype, fields: {}, inspection_notes: null }, error: null }) }) }) }
    }
    if (callCount === 2) {
      return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }
    }
    return { update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }) }
  })
  await POST(makeRequest({ assetId: 'asset-1' }) as Parameters<typeof POST>[0])
  return mockGenerateText.mock.calls[0][0].messages[0].content as string
}

// DESCR-01: Missing truck subtypes
describe('Phase 17 — DESCR-01 missing truck subtype headings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('contains CRANE TRUCK section heading', async () => {
    const s = await getSystemContentP17('truck', 'crane_truck')
    expect(s).toContain('CRANE TRUCK')
  })

  it('contains FUEL TRUCK section heading', async () => {
    const s = await getSystemContentP17('truck', 'fuel_truck')
    expect(s).toContain('FUEL TRUCK')
  })

  it('contains GARBAGE section heading', async () => {
    const s = await getSystemContentP17('truck', 'garbage')
    expect(s).toContain('GARBAGE')
  })

  it('contains HOOK BIN section heading', async () => {
    const s = await getSystemContentP17('truck', 'hook_bin')
    expect(s).toContain('HOOK BIN')
  })

  it('contains SKIP BIN section heading', async () => {
    const s = await getSystemContentP17('truck', 'skip_bin')
    expect(s).toContain('SKIP BIN')
  })

  it('contains STOCK TRUCK section heading', async () => {
    const s = await getSystemContentP17('truck', 'stock_truck')
    expect(s).toContain('STOCK TRUCK')
  })

  it('contains TANKER (TRUCK) section heading', async () => {
    const s = await getSystemContentP17('truck', 'tanker')
    expect(s).toContain('TANKER (TRUCK)')
  })

  it('contains TRAY TRUCK section heading', async () => {
    const s = await getSystemContentP17('truck', 'tray_truck')
    expect(s).toContain('TRAY TRUCK')
  })

  it('contains WATER TRUCK section heading', async () => {
    const s = await getSystemContentP17('truck', 'water_truck')
    expect(s).toContain('WATER TRUCK')
  })

  it('contains COUPE (TRUCK) section heading', async () => {
    const s = await getSystemContentP17('truck', 'coupe')
    expect(s).toContain('COUPE (TRUCK)')
  })
})

// DESCR-02: Trailer distinct sections
describe('Phase 17 — DESCR-02 trailer subtype headings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('contains FLAT DECK TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'flat_deck')
    expect(s).toContain('FLAT DECK TRAILER')
  })

  it('contains CURTAINSIDER TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'curtainsider')
    expect(s).toContain('CURTAINSIDER TRAILER')
  })

  it('contains PANTECH TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'pantech')
    expect(s).toContain('PANTECH TRAILER')
  })

  it('contains REFRIGERATED CURTAINSIDER (TRAILER) section heading', async () => {
    const s = await getSystemContentP17('trailer', 'refrigerated_curtainsider')
    expect(s).toContain('REFRIGERATED CURTAINSIDER')
  })

  it('contains REFRIGERATED PANTECH (TRAILER) section heading', async () => {
    const s = await getSystemContentP17('trailer', 'refrigerated_pantech')
    expect(s).toContain('REFRIGERATED PANTECH')
  })

  it('contains LOW LOADER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'low_loader')
    expect(s).toContain('LOW LOADER')
  })

  it('contains SIDE TIPPER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'side_tipper')
    expect(s).toContain('SIDE TIPPER')
  })

  it('contains TIPPER TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'tipper')
    expect(s).toContain('TIPPER TRAILER')
  })

  it('contains TANKER TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'tanker')
    expect(s).toContain('TANKER TRAILER')
  })

  it('contains TIMBER JINKER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'timber_jinker')
    expect(s).toContain('TIMBER JINKER')
  })

  it('contains SKEL TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'skel')
    expect(s).toContain('SKEL TRAILER')
  })

  it('contains STOCK TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'stock')
    expect(s).toContain('STOCK TRAILER')
  })

  it('contains SIDE LOADER (TRAILER) section heading', async () => {
    const s = await getSystemContentP17('trailer', 'side_loader')
    expect(s).toContain('SIDE LOADER')
  })

  it('contains CAR CARRIER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'car_carrier')
    expect(s).toContain('CAR CARRIER')
  })

  it('contains DOG / PIG / TAG section heading', async () => {
    const s = await getSystemContentP17('trailer', 'dog')
    expect(s).toContain('DOG / PIG / TAG')
  })

  it('contains DOG / PIG / TAG section heading for pig key', async () => {
    const s = await getSystemContentP17('trailer', 'pig')
    expect(s).toContain('DOG / PIG / TAG')
  })

  it('contains DOG / PIG / TAG section heading for tag key', async () => {
    const s = await getSystemContentP17('trailer', 'tag')
    expect(s).toContain('DOG / PIG / TAG')
  })

  it('contains DOLLY section heading', async () => {
    const s = await getSystemContentP17('trailer', 'dolly')
    expect(s).toContain('DOLLY')
  })

  it('contains PLANT TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'plant')
    expect(s).toContain('PLANT TRAILER')
  })

  it('contains WALKING FLOOR TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'walking_floor')
    expect(s).toContain('WALKING FLOOR TRAILER')
  })

  it('contains BOX TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'box')
    expect(s).toContain('BOX TRAILER')
  })

  it('contains DECK WIDENER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'deck_widener')
    expect(s).toContain('DECK WIDENER')
  })

  it('contains COUPE TRAILER section heading', async () => {
    const s = await getSystemContentP17('trailer', 'coupe')
    expect(s).toContain('COUPE TRAILER')
  })
})

// DESCR-04: New earthmoving subtypes
describe('Phase 17 — DESCR-04 new earthmoving subtype headings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('contains EARTHMOVING ATTACHMENTS section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'attachments')
    expect(s).toContain('EARTHMOVING ATTACHMENTS')
  })

  it('contains CONVEYORS / STACKERS section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'conveyors_stackers')
    expect(s).toContain('CONVEYORS / STACKERS')
  })

  it('contains CRUSHER section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'crusher')
    expect(s).toContain('CRUSHER')
  })

  it('contains MOTOR SCRAPER section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'motor_scraper')
    expect(s).toContain('MOTOR SCRAPER')
  })

  it('contains SCRAPER (PULL-TYPE) section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'scraper')
    expect(s).toContain('SCRAPER (PULL-TYPE)')
  })

  it('contains SCREENER section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'screener')
    expect(s).toContain('SCREENER')
  })

  it('contains TRACKED LOADER section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'tracked_loader')
    expect(s).toContain('TRACKED LOADER')
  })

  it('contains TRACKED SKID STEER LOADER section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'tracked_skid_steer_loader')
    expect(s).toContain('TRACKED SKID STEER LOADER')
  })

  it('contains WASHING section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'washing')
    expect(s).toContain('WASHING')
  })

  it('contains MOTOR GRADER section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'motor_grader')
    expect(s).toContain('MOTOR GRADER')
  })

  it('contains COUPE (EARTHMOVING) section heading', async () => {
    const s = await getSystemContentP17('earthmoving', 'coupe')
    expect(s).toContain('COUPE (EARTHMOVING)')
  })
})

// DESCR-05: Agriculture (new describe block)
describe('Phase 17 — DESCR-05 agriculture subtype headings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('contains TRACTOR section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'tractor')
    expect(s).toContain('TRACTOR')
  })

  it('contains COMBINE HARVESTER section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'combine_harvester')
    expect(s).toContain('COMBINE HARVESTER')
  })

  it('contains AIR SEEDER section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'air_seeder')
    expect(s).toContain('AIR SEEDER')
  })

  it('contains DISC SEEDER section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'disc_seeder')
    expect(s).toContain('DISC SEEDER')
  })

  it('contains SPRAY RIG / SPRAYER section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'spray_rig')
    expect(s).toContain('SPRAY RIG / SPRAYER')
  })

  it('contains BALER section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'baler')
    expect(s).toContain('BALER')
  })

  it('contains MOWER / CONDITIONER section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'mower_conditioner')
    expect(s).toContain('MOWER / CONDITIONER')
  })

  it('contains PLOUGH section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'plough')
    expect(s).toContain('PLOUGH')
  })

  it('contains GRAIN AUGER section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'grain_auger')
    expect(s).toContain('GRAIN AUGER')
  })

  it('contains FORESTRY EQUIPMENT section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'forestry')
    expect(s).toContain('FORESTRY EQUIPMENT')
  })

  it('contains OTHER AGRICULTURE section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'other')
    expect(s).toContain('OTHER AGRICULTURE')
  })

  it('contains COUPE (AGRICULTURE) section heading', async () => {
    const s = await getSystemContentP17('agriculture', 'coupe')
    expect(s).toContain('COUPE (AGRICULTURE)')
  })
})

// DESCR-06: Forklift (new describe block)
describe('Phase 17 — DESCR-06 forklift subtype headings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('contains FORKLIFT (CLEARVIEW MAST / CONTAINER MAST) section heading', async () => {
    const s = await getSystemContentP17('forklift', 'clearview_mast')
    expect(s).toContain('FORKLIFT (CLEARVIEW MAST / CONTAINER MAST)')
  })

  it('contains WALKIE STACKER section heading', async () => {
    const s = await getSystemContentP17('forklift', 'walkie_stacker')
    expect(s).toContain('WALKIE STACKER')
  })

  it('contains ELECTRIC PALLET JACK section heading', async () => {
    const s = await getSystemContentP17('forklift', 'electric_pallet_jack')
    expect(s).toContain('ELECTRIC PALLET JACK')
  })

  it('contains WALK BEHIND (PALLET JACK) section heading', async () => {
    const s = await getSystemContentP17('forklift', 'walk_behind')
    expect(s).toContain('WALK BEHIND (PALLET JACK)')
  })

  it('contains STOCK PICKER / ORDER PICKER section heading', async () => {
    const s = await getSystemContentP17('forklift', 'stock_picker')
    expect(s).toContain('STOCK PICKER / ORDER PICKER')
  })

  it('contains EWP (FORKLIFT-MOUNTED) section heading', async () => {
    const s = await getSystemContentP17('forklift', 'ewp')
    expect(s).toContain('EWP (FORKLIFT-MOUNTED)')
  })

  it('contains OTHER FORKLIFT section heading', async () => {
    const s = await getSystemContentP17('forklift', 'other')
    expect(s).toContain('OTHER FORKLIFT')
  })
})

// DESCR-07: Caravan subtypes (new describe block)
describe('Phase 17 — DESCR-07 caravan subtype headings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('contains CAMPER TRAILER section heading', async () => {
    const s = await getSystemContentP17('caravan', 'camper_trailer')
    expect(s).toContain('CAMPER TRAILER')
  })

  it('contains MOTORHOME section heading', async () => {
    const s = await getSystemContentP17('caravan', 'motorhome')
    expect(s).toContain('MOTORHOME')
  })

  it('contains OTHER CARAVAN / CAMPER section heading', async () => {
    const s = await getSystemContentP17('caravan', 'other')
    expect(s).toContain('OTHER CARAVAN / CAMPER')
  })

  it('contains COUPE (CARAVAN) section heading', async () => {
    const s = await getSystemContentP17('caravan', 'coupe')
    expect(s).toContain('COUPE (CARAVAN)')
  })
})

// DESCR-08: Marine subtypes
describe('Phase 17 — DESCR-08 marine subtype headings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('contains PRIVATE section heading', async () => {
    const s = await getSystemContentP17('marine', 'private')
    expect(s).toContain('PRIVATE')
  })

  it('contains RECREATIONAL section heading', async () => {
    const s = await getSystemContentP17('marine', 'recreational')
    expect(s).toContain('RECREATIONAL')
  })

  it('contains TRAILER BOAT section heading', async () => {
    const s = await getSystemContentP17('marine', 'trailer_boat')
    expect(s).toContain('TRAILER BOAT')
  })

  it('contains BARGE section heading', async () => {
    const s = await getSystemContentP17('marine', 'barge')
    expect(s).toContain('BARGE')
  })

  it('contains COMMERCIAL VESSEL section heading', async () => {
    const s = await getSystemContentP17('marine', 'commercial')
    expect(s).toContain('COMMERCIAL VESSEL')
  })

  it('contains FISHING VESSEL section heading', async () => {
    const s = await getSystemContentP17('marine', 'fishing_vessel')
    expect(s).toContain('FISHING VESSEL')
  })

  it('contains TUG / WORKBOAT section heading', async () => {
    const s = await getSystemContentP17('marine', 'tug')
    expect(s).toContain('TUG / WORKBOAT')
  })

  it('contains OTHER MARINE VESSEL section heading', async () => {
    const s = await getSystemContentP17('marine', 'other')
    expect(s).toContain('OTHER MARINE VESSEL')
  })

  it('contains COUPE (MARINE) section heading', async () => {
    const s = await getSystemContentP17('marine', 'coupe')
    expect(s).toContain('COUPE (MARINE)')
  })
})
