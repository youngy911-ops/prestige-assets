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
    <Link href={href} className="block group">
      <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] px-4 py-4 transition-all group-hover:bg-white/[0.07] group-hover:border-white/[0.14]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">{displayName}</span>
          <AssetStatusBadge status={status} />
        </div>
        <p className={`text-[17px] font-semibold leading-snug ${subtitle ? 'text-white' : 'text-white/30 italic font-normal'}`}>
          {subtitle ?? 'No data yet'}
        </p>
        <p className="text-xs text-white/35 mt-1.5">{relativeTime(updated_at)}</p>
      </div>
    </Link>
  )
}
