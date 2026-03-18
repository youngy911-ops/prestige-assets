import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { buildExtractionSchema, buildSystemPrompt, buildUserPrompt } from '@/lib/ai/extraction-schema'
import { getInspectionPriorityFields } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse request body
  let assetId: string
  try {
    const body = await req.json()
    assetId = body.assetId
    if (!assetId) return Response.json({ error: 'assetId required' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // 3. Load asset (RLS enforces ownership)
  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, inspection_notes')
    .eq('id', assetId)
    .single()
  if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 })

  // 4. Load photos sorted by sort_order
  const { data: photos } = await supabase
    .from('asset_photos')
    .select('storage_path')
    .eq('asset_id', assetId)
    .order('sort_order', { ascending: true })

  // 5. Generate signed URLs (1-hour expiry — generate immediately before AI call)
  const signedUrls = (
    await Promise.all(
      (photos ?? []).map(async (p) => {
        const { data } = await supabase.storage
          .from('photos')
          .createSignedUrl(p.storage_path, 3600)
        return data?.signedUrl ?? null
      })
    )
  ).filter((url): url is string => url !== null)

  // 6. Build extraction schema + prompts
  const assetType = asset.asset_type as AssetType
  const schema = buildExtractionSchema(assetType)
  const systemPrompt = buildSystemPrompt(asset.asset_type, asset.asset_subtype ?? '')

  // Priority fields are for UI display — their values come through inspection_notes text
  // No separate structured fields parsing needed; inspection_notes is plain text from staff
  const structuredFields: Record<string, string> = {}
  // Suppress unused variable warning
  void getInspectionPriorityFields(assetType)

  const userPrompt = buildUserPrompt(asset.inspection_notes, structuredFields)

  // 7. Call GPT-4o via Vercel AI SDK — use generateText + Output.object() (not deprecated generateObject)
  const { output } = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({ schema }),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          ...signedUrls.map(url => ({ type: 'image' as const, image: url })),
        ],
      },
    ],
  })

  // 8. Write extraction_result to DB — NEVER touch assets.fields
  await supabase
    .from('assets')
    .update({
      extraction_result: output,
      extraction_stale: false,
    })
    .eq('id', assetId)
    .eq('user_id', user.id)

  return Response.json({ success: true })
}
