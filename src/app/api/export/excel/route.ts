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

  // Build rows: header row + value row
  const headers = fields.map(f => f.label)
  const values = fields.map(f => savedFields[f.key] ?? '')

  // Add description as a final column if it exists
  const hasDesc = !!(asset.description as string | null)
  if (hasDesc) {
    headers.push('Auction Description')
    values.push((asset.description as string).replace(/\n/g, ' | '))
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, values])

  // Style: bold header row, freeze top row, auto column widths
  if (!ws['!cols']) ws['!cols'] = []
  headers.forEach((h, i) => {
    const colWidth = Math.max(h.length, (values[i] ?? '').length, 10)
    ws['!cols']![i] = { wch: Math.min(colWidth + 2, 50) }
  })

  // Freeze top row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Bold the header cells
  headers.forEach((_, i) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: i })
    if (ws[cellAddr]) {
      ws[cellAddr].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: '0C1A0F' } },
        border: { bottom: { style: 'thin', color: { rgb: '059669' } } },
      }
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Asset')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // Filename: "Slattery - 2015 Kenworth T409SAR.xlsx"
  const make = savedFields.make ?? ''
  const model = savedFields.model ?? ''
  const year = savedFields.year ?? ''
  const nameParts = [year, make, model].filter(Boolean)
  const assetName = nameParts.length > 0 ? nameParts.join(' ') : title
  const filename = `Slattery - ${assetName}.xlsx`.replace(/[/\\?%*:|"<>]/g, '-')

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
