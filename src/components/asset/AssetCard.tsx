'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Trash2, Loader2 } from 'lucide-react'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import { AssetStatusBadge } from './AssetStatusBadge'
import { relativeTime } from '@/lib/utils/relativeTime'
import { deleteAsset } from '@/lib/actions/asset.actions'
import type { AssetStatus } from '@/lib/actions/asset.actions'

interface AssetCardProps {
  id: string
  asset_type: string
  asset_subtype: string | null
  fields: Record<string, string>
  status: AssetStatus
  updated_at: string
  thumb_url?: string | null
  /** Animation delay for staggered entrance */
  animationDelay?: string
  onDeleted?: (id: string) => void
}

export function AssetCard({ id, asset_type, asset_subtype, fields, status, updated_at, thumb_url, animationDelay, onDeleted }: AssetCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const href = status === 'draft'
    ? `/assets/${id}/review`
    : `/assets/${id}/output`

  const displayName = getAssetDisplayTitle(asset_type, asset_subtype)
  const make = fields?.make ?? ''
  const model = fields?.model ?? ''
  const year = fields?.year ?? ''
  const subtitle = [make, model, year].filter(Boolean).join(' ') || null

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()  // Prevent Link navigation
    e.stopPropagation()
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    setDeleting(true)
    const result = await deleteAsset(id)
    if ('error' in result) {
      setDeleting(false)
      setConfirmingDelete(false)
    } else {
      onDeleted?.(id)
    }
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setConfirmingDelete(false)
  }

  return (
    <Link
      href={href}
      className="block group animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-both"
      style={animationDelay ? { animationDelay } : undefined}
    >
      <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] transition-all duration-150 group-hover:bg-white/[0.07] group-hover:border-white/[0.14] active:scale-[0.98] flex flex-col overflow-hidden">
        <div className="flex items-stretch">
          {/* Thumbnail */}
          <div className="w-20 flex-shrink-0 self-stretch relative overflow-hidden bg-white/[0.03]">
            {thumb_url ? (
              <img
                src={thumb_url}
                alt=""
                role="presentation"
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
          <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest truncate mr-2">{displayName}</span>
              <AssetStatusBadge status={status} />
            </div>
            <p className={`text-[16px] font-semibold leading-snug truncate ${subtitle ? 'text-white' : 'text-white/30 italic font-normal'}`}>
              {subtitle ?? 'No data yet'}
            </p>
            <p className="text-xs text-white/35 mt-1">{relativeTime(updated_at)}</p>
            <button
              type="button"
              onClick={handleDelete}
              className="absolute top-2 right-2 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete asset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {confirmingDelete && (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-white/[0.06] bg-red-500/5">
            <span className="text-xs text-red-300 flex-1">Delete this asset?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-semibold text-white bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
            </button>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="text-xs text-white/50 hover:text-white/80 px-2 py-1 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </Link>
  )
}
