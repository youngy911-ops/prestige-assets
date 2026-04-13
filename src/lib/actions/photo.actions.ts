'use server'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// insertPhoto — inserts record and returns signed URL in one call
// ---------------------------------------------------------------------------
export async function insertPhoto(params: {
  assetId: string
  storagePath: string
  sortOrder: number
}): Promise<{ id: string; signedUrl: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Server-side 80-photo cap
  const { count } = await supabase
    .from('asset_photos')
    .select('*', { count: 'exact', head: true })
    .eq('asset_id', params.assetId)
  if ((count ?? 0) >= 80) return { error: 'Photo limit reached' }

  const { data, error } = await supabase
    .from('asset_photos')
    .insert({
      asset_id: params.assetId,
      storage_path: params.storagePath,
      sort_order: params.sortOrder,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Set extraction_stale if asset already has extracted fields
  await supabase
    .from('assets')
    .update({ extraction_stale: true })
    .eq('id', params.assetId)
    .neq('fields', '{}')

  // Return signed URL in same call — saves a round trip
  const { data: urlData, error: urlError } = await supabase.storage
    .from('photos')
    .createSignedUrl(params.storagePath, 3600)

  if (urlError || !urlData?.signedUrl) return { error: urlError?.message ?? 'Failed to generate URL' }

  return { id: data.id, signedUrl: urlData.signedUrl }
}

// ---------------------------------------------------------------------------
// removePhoto
// ---------------------------------------------------------------------------
export async function removePhoto(
  photoId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch photo to get asset_id before deleting (for extraction_stale update)
  const { data: photo } = await supabase
    .from('asset_photos')
    .select('id, asset_id')
    .eq('id', photoId)
    .single()

  if (!photo) return { error: 'Photo not found' }

  const { error } = await supabase
    .from('asset_photos')
    .delete()
    .eq('id', photoId)

  if (error) return { error: error.message }

  // Set extraction_stale if asset already has extracted fields
  await supabase
    .from('assets')
    .update({ extraction_stale: true })
    .eq('id', photo.asset_id)
    .neq('fields', '{}')

  return { success: true }
}

// ---------------------------------------------------------------------------
// updatePhotoOrder
// ---------------------------------------------------------------------------
export async function updatePhotoOrder(
  updates: Array<{ id: string; sortOrder: number }>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Batch update — one upsert per photo (sort_order updates are small arrays, ≤80 rows)
  const upserts = updates.map(({ id, sortOrder }) =>
    supabase
      .from('asset_photos')
      .update({ sort_order: sortOrder })
      .eq('id', id)
  )
  const results = await Promise.all(upserts)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  // No revalidatePath — client does optimistic update; full page revalidation would cause flicker
  return { success: true }
}

// ---------------------------------------------------------------------------
// getSignedUrl — called client-side after upload for immediate thumbnail display
// ---------------------------------------------------------------------------
export async function getSignedUrl(
  storagePath: string
): Promise<{ signedUrl: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(storagePath, 3600) // 1 hour

  if (error || !data?.signedUrl) return { error: error?.message ?? 'Failed to generate URL' }
  return { signedUrl: data.signedUrl }
}
