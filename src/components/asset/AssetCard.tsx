import Link from 'next/link'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import { AssetStatusBadge } from './AssetStatusBadge'
import { relativeTime } from '@/lib/utils/relativeTime'

interface AssetCardProps {
  id: string
  asset_type: string
  asset_subtype: string | null
  fields: Record<string, string>
  status: 'draft' | 'confirmed'
  updated_at: string
  thumb_url?: string | null
}

export function AssetCard({ id, asset_type, asset_subtype, fields, status, updated_at, thumb_url }: AssetCardProps) {
  const href = status === 'draft'
    ? `/assets/${id}/review`
    : `/assets/${id}/output`

  const displayName = getAssetDisplayTitle(asset_type, asset_subtype)
  const make = fields?.make ?? ''
  const model = fields?.model ?? ''
  const year = fields?.year ?? ''
  const subtitle = [make, model, year].filter(Boolean).join(' ') || null

  return (
    <Link href={href} className="block group">
      <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] transition-all group-hover:bg-white/[0.07] group-hover:border-white/[0.14] flex items-stretch overflow-hidden">
        {/* Thumbnail */}
        <div className="w-20 flex-shrink-0 self-stretch relative overflow-hidden bg-white/[0.03]">
          {thumb_url ? (
            <img
              src={thumb_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-300"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-md bg-white/[0.06]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest truncate mr-2">{displayName}</span>
            <AssetStatusBadge status={status} />
          </div>
          <p className={`text-[16px] font-semibold leading-snug truncate ${subtitle ? 'text-white' : 'text-white/30 italic font-normal'}`}>
            {subtitle ?? 'No data yet'}
          </p>
          <p className="text-xs text-white/35 mt-1">{relativeTime(updated_at)}</p>
        </div>
      </div>
    </Link>
  )
}
