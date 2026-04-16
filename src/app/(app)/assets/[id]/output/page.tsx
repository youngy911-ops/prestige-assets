import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BRAND } from '@/lib/constants/brand'
import { generateFieldsBlock } from '@/lib/output/generateFieldsBlock'
import { OutputPanel } from '@/components/asset/OutputPanel'
import { StepIndicator } from '@/components/asset/StepIndicator'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'

export default async function OutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assetId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: asset }, { data: photos }] = await Promise.all([
    supabase
      .from('assets')
      .select('id, asset_type, asset_subtype, fields, description, status')
      .eq('id', assetId)
      .single(),
    supabase
      .from('asset_photos')
      .select('storage_path, sort_order')
      .eq('asset_id', assetId)
      .order('sort_order', { ascending: true }),
  ])

  if (!asset) redirect('/assets/new')

  // Batch signed URL generation — one API call regardless of photo count
  const photoList = photos ?? []
  const { data: signedUrlData } = photoList.length > 0
    ? await supabase.storage.from('photos').createSignedUrls(
        photoList.map(p => p.storage_path),
        3600
      )
    : { data: [] }

  const photoUrls: string[] = (signedUrlData ?? [])
    .map(r => r.signedUrl)
    .filter((u): u is string => !!u)

  // Compute fields block server-side — synchronous, always ready on page load
  const fieldsText = generateFieldsBlock(
    asset.asset_type as AssetType,
    (asset.fields ?? {}) as Record<string, string>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <div className="mb-4">
        <Link
          href={`/assets/${assetId}/review`}
          className="inline-flex items-center gap-1 text-sm text-white/65 hover:text-white mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Review
        </Link>
        <h1 className="text-xl font-semibold text-white">Output</h1>
        <p className="text-sm text-white/65 mt-0.5">
          {getAssetDisplayTitle(asset.asset_type, asset.asset_subtype)}
        </p>
      </div>
      {asset.status === 'draft' && <StepIndicator current="output" />}

      {/* Output blocks */}
      <OutputPanel
        assetId={assetId}
        assetType={asset.asset_type}
        fields={(asset.fields ?? {}) as Record<string, string>}
        fieldsText={fieldsText}
        initialDescription={(asset.description as string | null) ?? null}
        photoUrls={photoUrls}
      />

      {/* QR Code + actions */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 flex items-center gap-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&bgcolor=1a2e1a&color=ffffff&data=${encodeURIComponent(`https://${BRAND.domain}/assets/${assetId}/output`)}`}
            alt="QR code for this asset"
            width={80}
            height={80}
            className="rounded-lg flex-shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-white">Asset QR Code</p>
            <p className="text-xs text-white/45 mt-0.5">Scan to reopen this record on any device</p>
            <Link
              href={`/assets/${assetId}/report`}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2 transition-colors"
            >
              View condition report →
            </Link>
          </div>
        </div>
        <Link
          href="/assets/new"
          className="flex items-center justify-center w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white h-11 px-4 text-sm font-semibold transition-colors"
        >
          Book In New Asset
        </Link>
      </div>
    </div>
  )
}
