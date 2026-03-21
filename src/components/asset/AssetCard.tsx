import Link from 'next/link'

interface AssetCardProps {
  id: string
  asset_type: string
  asset_subtype: string | null
  fields: Record<string, string>
  status: 'draft' | 'confirmed'
  updated_at: string
}

export function AssetCard({ id, asset_type, asset_subtype, fields, status, updated_at }: AssetCardProps) {
  const href = status === 'draft' ? `/assets/${id}/review` : `/assets/${id}/output`

  const make = fields.make
  const model = fields.model
  const year = fields.year
  const hasData = make || model || year
  const subtitle = hasData ? [make, model, year].filter(Boolean).join(' ') : 'No data yet'

  return (
    <Link href={href} className="block">
      <div className="bg-white/10 rounded-lg px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium capitalize">
            {asset_type.replace(/_/g, ' ')}
            {asset_subtype ? ` — ${asset_subtype.replace(/_/g, ' ')}` : ''}
          </span>
          <span
            className={
              status === 'confirmed'
                ? 'text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white font-medium'
                : 'text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-medium'
            }
          >
            {status === 'confirmed' ? 'Confirmed' : 'Draft'}
          </span>
        </div>
        <p className="text-white/70 text-sm">{subtitle}</p>
      </div>
    </Link>
  )
}
