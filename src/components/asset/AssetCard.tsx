import Link from 'next/link'
import { SCHEMA_REGISTRY } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'
import { AssetStatusBadge } from './AssetStatusBadge'
import { relativeTime } from '@/lib/utils/relativeTime'

interface AssetCardProps {
  id: string
  asset_type: string
  asset_subtype: string | null
  fields: Record<string, string>
  status: 'draft' | 'confirmed'
  updated_at: string
}

export function AssetCard({ id, asset_type, asset_subtype: _subtype, fields, status, updated_at }: AssetCardProps) {
  const href = status === 'draft'
    ? `/assets/${id}/review`
    : `/assets/${id}/output`

  const displayName = SCHEMA_REGISTRY[asset_type as AssetType]?.displayName ?? asset_type
  const make = fields?.make ?? ''
  const model = fields?.model ?? ''
  const year = fields?.year ?? ''
  const subtitle = [make, model, year].filter(Boolean).join(' ') || null

  return (
    <Link href={href} className="block">
      <div className="bg-[#14532D] rounded-lg border border-[#1E3A5F] px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white/65 uppercase tracking-wide">{displayName}</span>
          <AssetStatusBadge status={status} />
        </div>
        <p className={`text-base font-medium ${subtitle ? 'text-white' : 'text-white/65 italic'}`}>
          {subtitle ?? 'No data yet'}
        </p>
        <p className="text-xs text-white/65 mt-1">{relativeTime(updated_at)}</p>
      </div>
    </Link>
  )
}
