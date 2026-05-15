import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const assetId = formData.get('assetId') as string | null
  const sortOrder = Number(formData.get('sortOrder') ?? 0)

  if (!file || !assetId) return Response.json({ error: 'file and assetId required' }, { status: 400 })

  const { count } = await supabase
    .from('asset_photos')
    .select('id', { count: 'exact', head: true })
    .eq('asset_id', assetId)
  if ((count ?? 0) >= 80) return Response.json({ error: 'Photo limit reached (80 max)' }, { status: 400 })

  // Physically rotate pixels to match EXIF orientation and strip the tag.
  // iPhone photos arrive with orientation metadata but pixels stored sideways —
  // autoOrient() bakes the rotation so GPT-4o always sees the image right-way up.
  const rawBuffer = Buffer.from(await file.arrayBuffer())
  let uploadBuffer: Buffer
  let uploadContentType: string
  try {
    uploadBuffer = await sharp(rawBuffer).autoOrient().jpeg({ quality: 92 }).toBuffer()
    uploadContentType = 'image/jpeg'
  } catch {
    // If sharp fails (e.g. unsupported format) fall back to the original bytes
    uploadBuffer = rawBuffer
    uploadContentType = file.type
  }

  const storagePath = `${user.id}/${assetId}/${Date.now()}-${sortOrder}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(storagePath, uploadBuffer, { contentType: uploadContentType, upsert: false })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { error: insertError } = await supabase
    .from('asset_photos')
    .insert({ asset_id: assetId, storage_path: storagePath, sort_order: sortOrder })

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

  return Response.json({ success: true, storagePath })
}
