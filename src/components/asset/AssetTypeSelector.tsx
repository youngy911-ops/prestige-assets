'use client'
import { ASSET_TYPES, type AssetType } from '@/lib/schema-registry/types'
import { SCHEMA_REGISTRY } from '@/lib/schema-registry/index'
import { Truck, Forklift, Shovel, Tractor, Boxes, Caravan, Sailboat, Car, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Custom trailer SVG — lucide has no trailer icon
function TrailerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Trailer body */}
      <rect x="1" y="4" width="18" height="12" rx="1.5" />
      {/* Rear axle wheels */}
      <circle cx="6.5" cy="19.5" r="2" />
      <circle cx="14.5" cy="19.5" r="2" />
      {/* Kingpin / hitch arm */}
      <path d="M19 10h3.5" />
      <circle cx="23" cy="10" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

type IconEntry =
  | { kind: 'lucide'; icon: LucideIcon }
  | { kind: 'custom'; component: React.FC<{ className?: string }> }

const ASSET_TYPE_ICONS: Record<AssetType, IconEntry> = {
  truck:         { kind: 'lucide',  icon: Truck },
  trailer:       { kind: 'custom',  component: TrailerIcon },
  earthmoving:   { kind: 'lucide',  icon: Shovel },
  agriculture:   { kind: 'lucide',  icon: Tractor },
  forklift:      { kind: 'lucide',  icon: Forklift },
  caravan:       { kind: 'lucide',  icon: Caravan },
  general_goods: { kind: 'lucide',  icon: Boxes },
  marine:        { kind: 'lucide',  icon: Sailboat },
  vehicle:       { kind: 'lucide',  icon: Car },
}

interface AssetTypeSelectorProps {
  selected: AssetType | null
  onSelect: (type: AssetType) => void
}

export function AssetTypeSelector({ selected, onSelect }: AssetTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ASSET_TYPES.map(type => {
        const entry = ASSET_TYPE_ICONS[type]
        const schema = SCHEMA_REGISTRY[type]
        const isSelected = selected === type
        const iconCls = cn('w-8 h-8', isSelected ? 'text-emerald-400' : 'text-white/60')

        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-xl p-4 min-h-[100px]',
              'border transition-all',
              isSelected
                ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]'
            )}
          >
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
              isSelected ? 'bg-emerald-500/15' : 'bg-white/[0.05]'
            )}>
              {entry.kind === 'lucide'
                ? <entry.icon className={iconCls} />
                : <entry.component className={iconCls} />
              }
            </div>
            <span className={cn('text-[13px] font-medium text-center leading-tight', isSelected ? 'text-white' : 'text-white/70')}>
              {schema.displayName}
            </span>
          </button>
        )
      })}
    </div>
  )
}
