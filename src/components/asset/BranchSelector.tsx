'use client'
import { BRANCHES, type BranchKey } from '@/lib/constants/branches'
import { cn } from '@/lib/utils'

interface BranchSelectorProps {
  selected: BranchKey | null
  onSelect: (branch: BranchKey) => void
}

export function BranchSelector({ selected, onSelect }: BranchSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {BRANCHES.map(branch => (
        <button
          key={branch.key}
          type="button"
          onClick={() => onSelect(branch.key as BranchKey)}
          className={cn(
            'w-full text-left px-4 py-3.5 rounded-xl text-[15px] font-medium text-white transition-all min-h-[52px]',
            'border',
            selected === branch.key
              ? 'border-emerald-500/60 bg-emerald-500/10'
              : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
          )}
        >
          {branch.label}
        </button>
      ))}
    </div>
  )
}
