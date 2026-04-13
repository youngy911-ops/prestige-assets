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
            'w-full text-left px-4 py-3 rounded-lg text-base text-white transition-all min-h-[48px]',
            'border-2',
            selected === subtype.key
              ? 'border-white bg-white/10'
              : 'border-[#1E3A5F] bg-[#14532D] hover:bg-white/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {subtype.label}
        </button>
      ))}
    </div>
  )
}
