import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReviewPageClient } from '@/components/asset/ReviewPageClient'
import { StepIndicator } from '@/components/asset/StepIndicator'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'
import type { AssetType } from '@/lib/schema-registry/types'

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id: assetId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, extraction_result, inspection_notes, fields, checklist_state, status')
    .eq('id', assetId)
    .single()

  if (!asset) redirect('/assets/new')

  // Duplicate detection — check VIN or serial_number against other assets
  const fields = (asset.fields ?? {}) as Record<string, string>
  const vin = fields.vin?.trim()
  const serial = fields.serial_number?.trim()
  let duplicateWarning: { id: string; asset_type: string; asset_subtype: string | null } | null = null

  // Whitelist identifierKey — must be one of these exact strings before use in filter
  const SAFE_IDENTIFIER_KEYS = ['vin', 'serial_number'] as const
  type SafeKey = typeof SAFE_IDENTIFIER_KEYS[number]
  const rawKey = vin ? 'vin' : serial ? 'serial_number' : null
  const identifierKey: SafeKey | null = rawKey && (SAFE_IDENTIFIER_KEYS as readonly string[]).includes(rawKey)
    ? rawKey as SafeKey : null
  const identifierValue = vin || serial || null

  if (identifierKey && identifierValue) {
    // Supabase JSONB filter: fields->>'vin' = '...' (identifierKey is whitelisted above)
    const { data: dupes } = await supabase
      .from('assets')
      .select('id, asset_type, asset_subtype')
      .neq('id', assetId)
      .eq('user_id', user.id)
      .filter(`fields->>${identifierKey}`, 'eq', identifierValue)
      .limit(1)

    if (dupes && dupes.length > 0) {
      duplicateWarning = dupes[0] as { id: string; asset_type: string; asset_subtype: string | null }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={asset.extraction_result ? `/assets/${assetId}/extract` : '/'}
          className="text-white/65 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Review</h1>
          <p className="text-sm text-white/65">
            {getAssetDisplayTitle(asset.asset_type, asset.asset_subtype)}
          </p>
        </div>
      </div>
      {asset.status === 'draft' && <StepIndicator current="review" />}

      <ReviewPageClient
        assetId={assetId}
        assetType={asset.asset_type as AssetType}
        extractionResult={asset.extraction_result as ExtractionResult | null}
        savedFields={(asset.fields as Record<string, string>) ?? {}}
        savedChecklistState={(asset.checklist_state as Record<string, string>) ?? {}}
        inspectionNotes={asset.inspection_notes}
        duplicateWarning={duplicateWarning}
      />
    </div>
  )
}
