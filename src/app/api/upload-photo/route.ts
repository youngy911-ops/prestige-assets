import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') ?? 'jpg'
  const storagePath = `${user.id}/${assetId}/${Date.now()}-${sortOrder}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { error: insertError } = await supabase
    .from('asset_photos')
    .insert({ asset_id: assetId, storage_path: storagePath, sort_order: sortOrder })

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

  return Response.json({ success: true, storagePath })
}
