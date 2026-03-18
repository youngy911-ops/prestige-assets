import { redirect } from 'next/navigation'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PhotoUploadZone } from '@/components/asset/PhotoUploadZone'
import type { PhotoItem } from '@/components/asset/PhotoUploadZone'
import { InspectionNotesSection } from '@/components/asset/InspectionNotesSection'
import { PhotosPageCTA } from '@/components/asset/PhotosPageCTA'
import type { AssetType } from '@/lib/schema-registry/types'

interface PhotosPageProps {
  params: Promise<{ id: string }>
}

export default async function PhotosPage({ params }: PhotosPageProps) {
  const { id: assetId } = await params
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load asset (RLS ensures user owns it)
  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, extraction_stale, fields, inspection_notes')
    .eq('id', assetId)
    .single()

  if (!asset) redirect('/assets/new')

  // Load photos sorted by sort_order
  const { data: photos } = await supabase
    .from('asset_photos')
    .select('id, storage_path, sort_order')
    .eq('asset_id', assetId)
    .order('sort_order', { ascending: true })

  // Generate presigned URLs for all photos (1 hour expiry — sufficient for on-site session)
  const photosWithUrls: PhotoItem[] = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from('photos')
        .createSignedUrl(photo.storage_path, 3600)
      return {
        id: photo.id,
        storagePath: photo.storage_path,
        signedUrl: data?.signedUrl ?? '',
        sortOrder: photo.sort_order,
      }
    })
  )

  const hasPhotos = photosWithUrls.length > 0
  const isExtractionStale = asset.extraction_stale && hasPhotos

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+24px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-white/65 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Photos</h1>
          <p className="text-sm text-white/65">
            {asset.asset_subtype
              ? `${asset.asset_type} — ${asset.asset_subtype}`
              : asset.asset_type}
          </p>
        </div>
      </div>

      {/* extraction_stale banner — shown only when asset already has extraction results and photos changed */}
      {isExtractionStale && (
        <div className="flex items-start gap-2 bg-[oklch(0.29_0.07_248)]/20 border border-[oklch(0.29_0.07_248)] rounded-md p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-white/65 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/85">
              New photos added — re-run AI extraction to update extracted fields?
            </p>
            <div className="flex gap-2 mt-2">
              <Link
                href={`/assets/${assetId}/extract`}
                className="text-xs text-white underline hover:no-underline"
              >
                Re-run Extraction
              </Link>
              <span className="text-xs text-white/40">·</span>
              <Link
                href={`/assets/${assetId}/review`}
                className="text-xs text-white/65 hover:text-white"
              >
                Keep existing results
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Photo upload zone — client component handles all upload interactions */}
      <PhotoUploadZone
        assetId={assetId}
        userId={user.id}
        initialPhotos={photosWithUrls}
      />

      {/* Inspection notes — below photo grid, above CTA */}
      <div className="mt-6">
        <InspectionNotesSection
          assetId={assetId}
          assetType={asset.asset_type as AssetType}
          initialNotes={asset.inspection_notes ?? null}
        />
      </div>

      {/* Next action */}
      <div className="mt-6">
        {hasPhotos ? (
          <PhotosPageCTA assetId={assetId} />
        ) : (
          <>
            <Link
              href={`/assets/${assetId}/review`}
              className="flex items-center justify-center w-full h-11 rounded-md bg-[oklch(0.29_0.07_248)] hover:bg-[oklch(0.29_0.07_248)]/90 text-white font-medium text-sm transition-colors"
            >
              Skip to Manual Entry
            </Link>
            <p className="text-xs text-white/65 text-center mt-2">
              No photos? You can enter all fields manually.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
