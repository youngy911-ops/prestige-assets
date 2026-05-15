import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse request body
  let assetId: string, message: string, assetType: string
  try {
    const body = await req.json()
    assetId = body.assetId
    message = body.message?.trim() ?? ''
    assetType = body.assetType ?? 'unknown'
    if (!assetId) return Response.json({ error: 'assetId required' }, { status: 400 })
    if (!message) return Response.json({ error: 'message required' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // 3. Load existing inspection_notes — RLS enforces ownership
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('inspection_notes')
    .eq('id', assetId)
    .eq('user_id', user.id)
    .single()

  if (assetError || !asset) return Response.json({ error: 'Asset not found' }, { status: 404 })

  const existingNotes = asset.inspection_notes ?? ''

  // 4. Call AI to format the user's message as structured inspection notes
  const { text: formattedNotes } = await generateText({
    model: openai('gpt-4o'),
    system: `You are an assistant that formats freeform asset inspection notes for ${assetType} assets into concise structured lines.
Extract specific details from what the user says and format them clearly, one item per line.
Use short, direct labels followed by the value (e.g. "Bull bar: yes", "Tow bar: yes", "Year: 2019", "GCM: 135,000 kg", "Damage: dent to driver front door approx 150mm").
Omit any conversational filler. Only output the formatted note lines — no preamble, no explanation.`,
    prompt: `The user said: "${message}"`,
  })

  // 5. Append formatted notes to existing inspection_notes
  const separator = existingNotes.trim() ? '\n' : ''
  const updatedNotes = existingNotes.trim() + separator + formattedNotes.trim()

  const { error: updateError } = await supabase
    .from('assets')
    .update({ inspection_notes: updatedNotes })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  return Response.json({ notes: updatedNotes })
}
