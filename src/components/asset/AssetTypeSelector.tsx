'use client'
import { ASSET_TYPES, type AssetType } from '@/lib/schema-registry/types'
import { SCHEMA_REGISTRY } from '@/lib/schema-registry/index'
import { Truck, Container, HardHat, Tractor, Package2, Home, ShoppingBag } from 'lucide-react'
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
              'flex flex-col items-center justify-center gap-2 rounded-lg p-4 min-h-[80px]',
              'border-2 transition-all',
              isSelected
                ? 'border-white bg-white/10'
                : 'border-[#1E3A5F] bg-[#14532D] hover:bg-white/5'
            )}
          >
            <Icon className="w-8 h-8 text-white" />
            <span className="text-sm text-white text-center leading-tight">
              {schema.displayName}
            </span>
          </button>
        )
      })}
    </div>
  )
}
