import { render, screen } from '@testing-library/react'
import { AssetCard } from '@/components/asset/AssetCard'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

// Mock server actions — asset.actions uses 'use server' + server-only which can't run in jsdom
vi.mock('@/lib/actions/asset.actions', () => ({
  deleteAsset: vi.fn().mockResolvedValue({ success: true }),
  markAssetConfirmed: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock next/link — render as plain <a>
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('AssetCard', () => {
  const baseProps = {
    id: 'asset-123',
    asset_type: 'truck',
    asset_subtype: 'prime_mover',
    fields: {},
    status: 'draft' as 'draft' | 'reviewed' | 'confirmed',
    updated_at: '2026-03-21T00:00:00Z',
  }

  it('draft asset card links to /assets/[id]/review', () => {
    render(<AssetCard {...baseProps} status="draft" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/assets/asset-123/review')
  })

  it('confirmed asset card links to /assets/[id]/output', () => {
    render(<AssetCard {...baseProps} status="confirmed" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/assets/asset-123/output')
  })

  it('shows year make model when fields has data', () => {
    render(
      <AssetCard
        {...baseProps}
        fields={{ make: 'Caterpillar', model: '320', year: '2020' }}
      />
    )
    expect(screen.getByText('2020 Caterpillar 320')).toBeInTheDocument()
  })

  it("shows asset type name when fields is empty", () => {
    render(<AssetCard {...baseProps} fields={{}} />)
    // When no make/model/year, falls back to displayName — no 'No data yet' text
    expect(screen.queryByText('No data yet')).not.toBeInTheDocument()
  })

  it("shows 'Draft' badge for draft status", () => {
    render(<AssetCard {...baseProps} status="draft" />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it("shows 'Confirmed' badge for confirmed status", () => {
    render(<AssetCard {...baseProps} status="confirmed" />)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it("shows 'Reviewed' badge for reviewed status", () => {
    render(<AssetCard {...baseProps} status="reviewed" />)
    expect(screen.getByText('Reviewed')).toBeInTheDocument()
  })

  it('reviewed asset card links to /assets/[id]/output', () => {
    render(<AssetCard {...baseProps} status="reviewed" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/assets/asset-123/output')
  })
})
