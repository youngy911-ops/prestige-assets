'use client'
import { ASSET_TYPES, type AssetType } from '@/lib/schema-registry/types'
import { SCHEMA_REGISTRY } from '@/lib/schema-registry/index'
import { Truck, Container, HardHat, Tractor, Package2, Home, ShoppingBag, Anchor } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const ASSET_TYPE_ICONS: Record<AssetType, LucideIcon> = {
  truck:         Truck,
  trailer:       Container,
  earthmoving:   HardHat,
  agriculture:   Tractor,
  forklift:      Package2,
  caravan:       Home,
  general_goods: ShoppingBag,
  marine:        Anchor,
}

interface AssetTypeSelectorProps {
  selected: AssetType | null
  onSelect: (type: AssetType) => void
}

export function AssetTypeSelector({ selected, onSelect }: AssetTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ASSET_TYPES.map(type => {
        const Icon = ASSET_TYPE_ICONS[type]
        const schema = SCHEMA_REGISTRY[type]
        const isSelected = selected === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              'flex flex-col items-center justify-center gap-2.5 rounded-xl p-4 min-h-[90px]',
              'border transition-all',
              isSelected
                ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]'
            )}
          >
            <Icon className={cn('w-7 h-7', isSelected ? 'text-emerald-400' : 'text-white/60')} />
            <span className={cn('text-[13px] font-medium text-center leading-tight', isSelected ? 'text-white' : 'text-white/70')}>
              {schema.displayName}
            </span>
          </button>
        )
      })}
    </div>
  )
}
