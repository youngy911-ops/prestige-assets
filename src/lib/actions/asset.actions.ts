'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAsset(
  branch: string,
  assetType: string,
  assetSubtype: string
): Promise<{ assetId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      user_id: user.id,
      branch,
      asset_type: assetType,
      asset_subtype: assetSubtype,
      fields: {},
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { assetId: data.id }
}

export type AssetSummary = {
  id: string
  asset_type: string
  asset_subtype: string | null
  fields: Record<string, string>
  status: 'draft' | 'confirmed'
  updated_at: string
  thumb_url: string | null
}

export async function getAssets(branch: string): Promise<AssetSummary[] | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, status, updated_at')
    .eq('user_id', user.id)
    .eq('branch', branch)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message }
  const assets = (data ?? []) as Omit<AssetSummary, 'thumb_url'>[]

  if (assets.length === 0) return []

  // Fetch first photo path for each asset in one query
  const assetIds = assets.map(a => a.id)
  const { data: photos } = await supabase
    .from('asset_photos')
    .select('asset_id, storage_path')
    .in('asset_id', assetIds)
    .order('sort_order', { ascending: true })

  // Build map: asset_id → first storage_path
  const firstPhotoMap = new Map<string, string>()
  for (const p of photos ?? []) {
    if (!firstPhotoMap.has(p.asset_id)) firstPhotoMap.set(p.asset_id, p.storage_path)
  }

  // Generate signed URLs in parallel (short 10-min expiry — list view only)
  const withThumbs = await Promise.all(
    assets.map(async asset => {
      const storagePath = firstPhotoMap.get(asset.id)
      if (!storagePath) return { ...asset, thumb_url: null }
      const { data } = await supabase.storage.from('photos').createSignedUrl(storagePath, 600)
      return { ...asset, thumb_url: data?.signedUrl ?? null }
    })
  )

  return withThumbs
}

export async function getTodayBookingCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())

  return count ?? 0
}
