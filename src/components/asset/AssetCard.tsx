'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Trash2, Loader2, Camera } from 'lucide-react'
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
  extraction_result?: unknown | null
  /** Animation delay for staggered entrance */
  animationDelay?: string
  onDeleted?: (id: string) => void
}

export function AssetCard({ id, asset_type, asset_subtype, fields, status, updated_at, thumb_url, extraction_result, animationDelay, onDeleted }: AssetCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isExtracting = extraction_result === null && status === 'draft'
  const href = isExtracting
    ? `/assets/${id}/extract`
    : status === 'draft'
    ? `/assets/${id}/review`
    : `/assets/${id}/output`

  const displayName = getAssetDisplayTitle(asset_type, asset_subtype)
  const make = fields?.make ?? ''
  const model = fields?.model ?? ''
  const year = fields?.year ?? ''
  const variant = fields?.variant ?? ''
  const subtitle = [year, make, model, variant].filter(Boolean).join(' ') || null

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
      className="block group animate-in fade-in slide-in-from-bottom-1 duration-200 fill-mode-both rounded-2xl"
      style={animationDelay ? { animationDelay } : undefined}
    >
      <div
        className="rounded-2xl border border-white/[0.11] transition-all duration-200 group-hover:border-emerald-500/30 group-hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(52,211,153,0.1)] active:scale-[0.98] flex flex-col overflow-hidden relative"
        style={{
          background: status === 'confirmed'
            ? 'linear-gradient(135deg, oklch(0.24 0.07 148) 0%, oklch(0.22 0.06 148) 100%)'
            : 'linear-gradient(135deg, oklch(0.24 0.06 148) 0%, oklch(0.21 0.05 148) 100%)'
        }}
      >
        {/* Status accent stripe */}
        <div className={`h-full w-1.5 flex-shrink-0 absolute left-0 top-0 bottom-0 rounded-l-2xl ${
          status === 'confirmed' ? 'bg-emerald-500/70' :
          status === 'reviewed' ? 'bg-blue-400/60' :
          isExtracting ? 'bg-amber-400/60' :
          'bg-white/[0.08]'
        }`} />
        <div className="flex items-stretch pl-1">
          {/* Thumbnail */}
          <div className="w-[88px] flex-shrink-0 self-stretch relative overflow-hidden bg-white/[0.06]">
            {thumb_url ? (
              <>
                <img
                  src={thumb_url}
                  alt=""
                  role="presentation"
                  className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-300"
                  loading="lazy"
                />
                {status === 'confirmed' && thumb_url && (
                  <div className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-emerald-500/90 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                {status === 'confirmed' && (
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white/20" />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest truncate mr-2">{displayName}</span>
              {isExtracting ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide bg-amber-500/10 text-amber-400/70 border border-amber-500/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse flex-shrink-0" />
                  Extracting…
                </span>
              ) : (
                <AssetStatusBadge status={status} />
              )}
            </div>
            <p className={`text-[16px] font-semibold leading-snug truncate ${subtitle ? 'text-white' : 'text-white/25 font-normal'}`}>
              {subtitle ?? displayName}
            </p>
            <p className="text-xs text-white/35 mt-1" suppressHydrationWarning>{relativeTime(updated_at)}</p>
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
