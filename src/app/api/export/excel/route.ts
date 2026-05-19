import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFieldsSortedBySfOrder, getAssetDisplayTitle } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'
import * as XLSX from 'xlsx'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const assetId = req.nextUrl.searchParams.get('assetId')
  if (!assetId) return Response.json({ error: 'assetId required' }, { status: 400 })

  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, description, status')
    .eq('id', assetId)
    .eq('user_id', user.id)
    .single()

  if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 })

  const assetType = asset.asset_type as AssetType
  const fields = getFieldsSortedBySfOrder(assetType)
  const savedFields = (asset.fields ?? {}) as Record<string, string>
  const title = getAssetDisplayTitle(assetType, asset.asset_subtype)

  const make = savedFields.make ?? ''
  const model = savedFields.model ?? ''
  const year = savedFields.year ?? ''
  const nameParts = [year, make, model, savedFields.variant].filter(Boolean)
  const assetName = nameParts.length > 0 ? nameParts.join(' ') : title

  // Two-column layout: Field Label | Value
  // Row 1: Asset title as header
  // Row 2: blank
  // Row 3+: Field | Value pairs (only filled fields)
  // Then blank row + description block

  const rows: (string | number)[][] = []

  // Title row
  rows.push([assetName, ''])
  rows.push(['', ''])
  rows.push(['Field', 'Value'])

  // Field rows — only include fields that have values
  for (const f of fields) {
    const val = savedFields[f.key] ?? ''
    rows.push([f.label, val])
  }

  // Description block
  const desc = asset.description as string | null
  if (desc) {
    rows.push(['', ''])
    rows.push(['Auction Description', ''])
    rows.push([desc, ''])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Column widths: label col 28 wide, value col 50 wide
  ws['!cols'] = [{ wch: 28 }, { wch: 55 }]

  // Style cells
  // Row 0 (title): large bold
  const titleCell = ws['A1']
  if (titleCell) {
    titleCell.s = { font: { bold: true, sz: 14, color: { rgb: '0C1A0F' } } }
  }

  // Row 2 (header row at index 2): bold with background
  ;['A3', 'B3'].forEach(addr => {
    const cell = ws[addr]
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '059669' } },
      }
    }
  })

  // Merge title across both columns (A1:B1)
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]

  // Freeze the header row (row 3 = index 2)
  ws['!freeze'] = { xSplit: 0, ySplit: 3 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Asset')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const filename = `Slattery - ${assetName}.xlsx`.replace(/[/\\?%*:|"<>]/g, '-')

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
