import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateFieldsBlock } from '@/lib/output/generateFieldsBlock'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'
import { ReportClient } from '@/components/asset/ReportClient'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assetId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: asset }, { data: photos }] = await Promise.all([
    supabase
      .from('assets')
      .select('id, asset_type, asset_subtype, fields, description, inspection_notes')
      .eq('id', assetId)
      .single(),
    supabase
      .from('asset_photos')
      .select('storage_path, sort_order')
      .eq('asset_id', assetId)
      .order('sort_order', { ascending: true }),
  ])

  if (!asset) redirect('/')

  // Batch signed URL generation — one API call regardless of photo count
  const photoList = photos ?? []
  const { data: signedUrlData } = photoList.length > 0
    ? await supabase.storage.from('photos').createSignedUrls(
        photoList.map(p => p.storage_path),
        3600
      )
    : { data: [] }

  const signedUrls: string[] = (signedUrlData ?? [])
    .map(r => r.signedUrl)
    .filter((u): u is string => !!u)

  const fieldsText = generateFieldsBlock(
    asset.asset_type as AssetType,
    (asset.fields ?? {}) as Record<string, string>
  )

  const title = getAssetDisplayTitle(asset.asset_type, asset.asset_subtype)

  return (
    <ReportClient
      assetId={assetId}
      title={title}
      fieldsText={fieldsText}
      description={(asset.description as string | null) ?? null}
      photoUrls={signedUrls}
    />
  )
}
