'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react'
import { ConfidenceBadge } from '@/components/asset/ConfidenceBadge'
import { getFieldsSortedBySfOrder } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

interface ExtractionResultPanelProps {
  assetId: string
  assetType: AssetType
  extractionResult: ExtractionResult
  onRerun: () => void
}

export function ExtractionResultPanel({
  assetId,
  assetType,
  extractionResult,
  onRerun,
}: ExtractionResultPanelProps) {
  const router = useRouter()
  const fields = getFieldsSortedBySfOrder(assetType)
  const [showNotFound, setShowNotFound] = useState(false)

  // Prefetch review page as soon as extraction results are visible
  useEffect(() => {
    router.prefetch(`/assets/${assetId}/review`)
  }, [assetId, router])

  const foundFields = fields.filter(f => extractionResult[f.key]?.value != null)
  const notFoundFields = fields.filter(f => extractionResult[f.key]?.value == null)

  return (
    <div className="flex flex-col">
      {/* Success indicator */}
      <div className="flex items-center gap-2 mb-3 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="text-base font-bold text-emerald-300">Extraction complete</span>
      </div>
      {/* Summary pill */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-white/50 font-medium">
          <span className="font-black text-2xl text-white">{foundFields.length}</span> of {fields.length} fields extracted
        </span>
        {foundFields.length > 0 && (
          <span className="text-sm font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1">
            {Math.round((foundFields.length / fields.length) * 100)}%
          </span>
        )}
      </div>

      {/* Confidence bar */}
      {foundFields.length > 0 && (() => {
        const high = foundFields.filter(f => extractionResult[f.key]?.confidence === 'high').length
        const medium = foundFields.filter(f => extractionResult[f.key]?.confidence === 'medium').length
        const low = foundFields.filter(f => extractionResult[f.key]?.confidence === 'low').length
        const total = foundFields.length
        return (
          <div className="flex items-center gap-2 mb-5">
            <div className="flex-1 rounded-full overflow-hidden bg-white/[0.06]">
              <div className="flex h-2 gap-px">
                {high > 0 && <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(high/total)*100}%` }} />}
                {medium > 0 && <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(medium/total)*100}%` }} />}
                {low > 0 && <div className="h-full bg-red-400/70 rounded-full" style={{ width: `${(low/total)*100}%` }} />}
              </div>
            </div>
            <span className="text-xs text-white/40 font-medium flex-shrink-0 tabular-nums">
              {high} from photo · {medium} estimated
            </span>
          </div>
        )
      })()}

      {/* Found fields */}
      {foundFields.length > 0 && (
        <div className="flex flex-col divide-y divide-white/10 rounded-2xl border border-white/[0.08] bg-white/[0.03] mb-4 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
          {foundFields.map(field => {
            const extracted = extractionResult[field.key]!
            const confidence: 'high' | 'medium' | 'low' | 'not_found' = extracted.confidence ?? 'not_found'
            return (
              <div key={field.key} className="flex items-center justify-between px-4 py-3.5 gap-2">
                <span className="text-sm text-white/60 flex-1 min-w-0 truncate font-medium">{field.label}</span>
                <span className="text-[14px] font-bold text-white flex-shrink-0 mx-2 max-w-[180px] truncate text-right">
                  {extracted.value}
                </span>
                <ConfidenceBadge level={confidence} />
              </div>
            )
          })}
        </div>
      )}

      {/* Not-found fields — collapsed by default */}
      {notFoundFields.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowNotFound(v => !v)}
            aria-expanded={showNotFound}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/65 transition-colors w-full text-left py-1"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showNotFound ? 'rotate-180' : ''}`} />
            {notFoundFields.length} field{notFoundFields.length !== 1 ? 's' : ''} not found
          </button>
          {showNotFound && (
            <div className="flex flex-col divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.02] mt-2 overflow-hidden">
              {notFoundFields.map(field => (
                <div key={field.key} className="flex items-center justify-between px-4 py-2.5 gap-2">
                  <span className="text-sm text-white/35 flex-1 min-w-0 truncate">{field.label}</span>
                  <span className="text-xs text-white/25 flex-shrink-0">Not found</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky CTA */}
      <div className="sticky bottom-0 bg-[var(--background)]/90 backdrop-blur-xl border-t border-white/[0.06] pt-3 pb-1">
        <button
          type="button"
          onClick={() => router.push(`/assets/${assetId}/review`)}
          className="flex items-center justify-center w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[15px] transition-colors gap-1"
        >
          Proceed to Review
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRerun}
          className="w-full text-sm text-white/50 hover:text-white/80 text-center mt-2 py-1.5 border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all"
        >
          Re-run Extraction
        </button>
      </div>
    </div>
  )
}
