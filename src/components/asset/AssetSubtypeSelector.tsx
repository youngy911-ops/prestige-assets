'use client'
import { getSubtypes, type AssetType } from '@/lib/schema-registry/index'
import { cn } from '@/lib/utils'

interface AssetSubtypeSelectorProps {
  assetType: AssetType
  selected: string | null
  onSelect: (subtype: string) => void
  disabled?: boolean
}

export function AssetSubtypeSelector({ assetType, selected, onSelect, disabled }: AssetSubtypeSelectorProps) {
  const subtypes = getSubtypes(assetType)
  return (
    <div className="flex flex-col gap-2">
      {subtypes.map(subtype => (
        <button
          key={subtype.key}
          type="button"
          onClick={() => onSelect(subtype.key)}
          disabled={disabled}
          className={cn(
            'w-full text-left px-4 py-3.5 rounded-xl text-[15px] font-medium text-white transition-all min-h-[52px]',
            'border',
            selected === subtype.key
              ? 'border-emerald-500/60 bg-emerald-500/10'
              : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {subtype.label}
        </button>
      ))}
    </div>
  )
}
