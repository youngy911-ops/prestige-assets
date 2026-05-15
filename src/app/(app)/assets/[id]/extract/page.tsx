import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExtractionPageClient } from '@/components/asset/ExtractionPageClient'
import { StepIndicator } from '@/components/asset/StepIndicator'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'
import type { AssetType } from '@/lib/schema-registry/types'

interface ExtractPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ autostart?: string; hasPhotos?: string }>
}

export default async function ExtractPage({ params, searchParams }: ExtractPageProps) {
  const { id: assetId } = await params
  const { autostart, hasPhotos: hasPhotosParam } = await searchParams
  const autoStart = autostart === '1'
  // When navigating from the photos page CTA, hasPhotos=1 is passed so we can
  // skip the separate DB count query — saves one round-trip on the hot path.
  const hasPhotosKnown = hasPhotosParam === '1'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const assetQuery = supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, extraction_result, inspection_notes')
    .eq('id', assetId)
    .single()

  let asset: Awaited<typeof assetQuery>['data']
  let hasPhotos: boolean

  if (hasPhotosKnown) {
    // Fast path: skip the photo count query entirely
    const { data } = await assetQuery
    asset = data
    hasPhotos = true
  } else {
    // Slow path (direct URL access): fetch asset + photo count in parallel
    const [{ data }, { count: photoCount }] = await Promise.all([
      assetQuery,
      supabase
        .from('asset_photos')
        .select('id', { count: 'exact', head: true })
        .eq('asset_id', assetId),
    ])
    asset = data
    hasPhotos = (photoCount ?? 0) > 0
  }

  if (!asset) redirect('/assets/new')

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`/assets/${assetId}/photos`}
          className="text-white/65 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Extracting Details</h1>
          <p className="text-sm text-white/65">
            {getAssetDisplayTitle(asset.asset_type, asset.asset_subtype)}
          </p>
        </div>
      </div>
      <StepIndicator current="extract" />

      <ExtractionPageClient
        assetId={assetId}
        assetType={asset.asset_type as AssetType}
        initialExtractionResult={asset.extraction_result as ExtractionResult | null}
        inspectionNotes={asset.inspection_notes}
        hasPhotos={hasPhotos}
        autoStart={autoStart}
      />
    </div>
  )
}
