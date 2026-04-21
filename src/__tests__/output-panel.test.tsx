import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { FieldsBlock } from '@/components/asset/FieldsBlock'
import { DescriptionBlock } from '@/components/asset/DescriptionBlock'

// Mock server actions — server actions use 'use server' + server-only which can't run in jsdom
vi.mock('@/lib/actions/asset.actions', () => ({
  deleteAsset: vi.fn().mockResolvedValue({ success: true }),
  markAssetConfirmed: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/actions/review.actions', () => ({
  saveDescription: vi.fn().mockResolvedValue({ success: true }),
  saveReview: vi.fn().mockResolvedValue({ success: true }),
}))

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const SAMPLE_FIELDS = 'VIN: ABC123\nMake: Kenworth\nModel: T610'
const SAMPLE_DESC = '2019 Kenworth T610 Prime Mover\nSold As Is, Untested & Unregistered.'

describe('FieldsBlock', () => {
  it('renders fields text in the component', () => {
    render(<FieldsBlock fieldsText={SAMPLE_FIELDS} />)
    expect(screen.getByText(/VIN: ABC123/)).toBeTruthy()
  })

  it('copy button calls navigator.clipboard.writeText with the full fields text', async () => {
    render(<FieldsBlock fieldsText={SAMPLE_FIELDS} />)
    const copyBtn = screen.getByRole('button', { name: /^copy$/i })
    await act(async () => { fireEvent.click(copyBtn) })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SAMPLE_FIELDS)
  })

  it('copy button label changes to "Copied!" immediately after click', async () => {
    render(<FieldsBlock fieldsText={SAMPLE_FIELDS} />)
    const copyBtn = screen.getByRole('button', { name: /^copy$/i })
    await act(async () => { fireEvent.click(copyBtn) })
    expect(screen.getByRole('button', { name: /copied!/i })).toBeTruthy()
  })

  it('copy button label reverts to "Copy" after 2000ms', async () => {
    render(<FieldsBlock fieldsText={SAMPLE_FIELDS} />)
    const copyBtn = screen.getByRole('button', { name: /^copy$/i })
    await act(async () => { fireEvent.click(copyBtn) })
    await act(async () => { vi.advanceTimersByTime(2001) })
    expect(screen.getByRole('button', { name: /^copy$/i })).toBeTruthy()
  })
})

describe('DescriptionBlock', () => {
  const noop = vi.fn()

  it('renders an editable textarea with the description text', () => {
    render(<DescriptionBlock descriptionText={SAMPLE_DESC} onRegenerate={noop} isRegenerating={false} />)
    const textarea = screen.getByRole('textbox')
    expect((textarea as HTMLTextAreaElement).value).toBe(SAMPLE_DESC)
  })

  it('copy button calls navigator.clipboard.writeText with description text', async () => {
    render(<DescriptionBlock descriptionText={SAMPLE_DESC} onRegenerate={noop} isRegenerating={false} />)
    const copyBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Copy') && !btn.textContent?.includes('Regenerate'))!
    await act(async () => { fireEvent.click(copyBtn) })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SAMPLE_DESC)
  })

  it('copy button label changes to "Copied!" immediately after click', async () => {
    render(<DescriptionBlock descriptionText={SAMPLE_DESC} onRegenerate={noop} isRegenerating={false} />)
    const copyBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Copy') && !btn.textContent?.includes('Regenerate'))!
    await act(async () => { fireEvent.click(copyBtn) })
    expect(screen.getByRole('button', { name: /copied!/i })).toBeTruthy()
  })

  it('renders a "Regenerate" button', () => {
    render(<DescriptionBlock descriptionText={SAMPLE_DESC} onRegenerate={noop} isRegenerating={false} />)
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeTruthy()
  })
})
