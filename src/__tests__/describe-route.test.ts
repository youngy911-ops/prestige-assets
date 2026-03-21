import { describe, it, vi, beforeEach } from 'vitest'

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
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => ({ modelId: 'gpt-4o' })),
}))

// NOTE: Dynamic import AFTER all vi.mock() calls
// The actual route does not exist yet — this file is a Wave 0 scaffold.
// Tests marked .todo will be implemented in plan 05-02.

describe('POST /api/describe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.todo('returns 401 for unauthenticated request')
  it.todo('returns 400 when assetId is missing from body')
  it.todo('returns 404 when asset does not exist')
  it.todo('calls generateText with DESCRIPTION_SYSTEM_PROMPT and photo signed URLs')
  it.todo('persists description text to assets.description in DB with user_id guard')
  it.todo('returns { success: true, description: string } on success')
})
