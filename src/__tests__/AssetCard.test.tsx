import { render, screen } from '@testing-library/react'
import { AssetCard } from '@/components/asset/AssetCard'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

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
    status: 'draft' as const,
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

  it('shows make model year when fields has data', () => {
    render(
      <AssetCard
        {...baseProps}
        fields={{ make: 'Caterpillar', model: '320', year: '2020' }}
      />
    )
    expect(screen.getByText('Caterpillar 320 2020')).toBeInTheDocument()
  })

  it("shows 'No data yet' when fields is empty", () => {
    render(<AssetCard {...baseProps} fields={{}} />)
    expect(screen.getByText('No data yet')).toBeInTheDocument()
  })

  it("shows 'Draft' badge for draft status", () => {
    render(<AssetCard {...baseProps} status="draft" />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it("shows 'Confirmed' badge for confirmed status", () => {
    render(<AssetCard {...baseProps} status="confirmed" />)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })
})
