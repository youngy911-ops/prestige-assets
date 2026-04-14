'use server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

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
// pickHeroShot — uses GPT-4o vision to select the best exterior/cover photo
// Returns the 0-based index within the asset's sort_order-sorted photo list
// ---------------------------------------------------------------------------
export async function pickHeroShot(
  assetId: string
): Promise<{ heroIndex: number } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch first 8 photos by sort_order
  const { data: photos } = await supabase
    .from('asset_photos')
    .select('id, storage_path')
    .eq('asset_id', assetId)
    .order('sort_order', { ascending: true })
    .limit(8)

  if (!photos || photos.length < 2) return { heroIndex: 0 }

  // Generate short-lived signed URLs
  const signedUrls = await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage.from('photos').createSignedUrl(p.storage_path, 300)
      return data?.signedUrl ?? null
    })
  )
  const validUrls = signedUrls.filter(Boolean) as string[]
  if (validUrls.length < 2) return { heroIndex: 0 }

  const n = validUrls.length
  const { text } = await generateText({
    model: openai('gpt-4o'),
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are selecting the best hero/cover photo for an auction listing thumbnail. Look at these ${n} photos (indexed 0 to ${n - 1}) and pick the single best one.\n\nPrefer photos that:\n- Show the complete exterior of the asset (whole vehicle/machine visible)\n- Are taken from a 3/4 front or side angle\n- Are well-lit and in focus\n- Would make the best small square thumbnail\n\nAvoid: detail shots, interior shots, damage close-ups, compliance plates.\n\nReturn ONLY valid JSON: {"best_index": N}`,
        },
        ...validUrls.map((url) => ({ type: 'image' as const, image: url })),
      ],
    }],
    maxTokens: 30,
  })

  try {
    const parsed = JSON.parse(text.trim())
    const idx = Number(parsed.best_index)
    if (!isNaN(idx) && idx >= 0 && idx < n) return { heroIndex: idx }
  } catch { /* fall through */ }

  return { heroIndex: 0 }
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
