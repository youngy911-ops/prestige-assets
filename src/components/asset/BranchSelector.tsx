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
            'w-full text-left px-4 py-3.5 rounded-xl text-[15px] transition-all min-h-[52px]',
            'border',
            selected === branch.key
              ? 'border-emerald-400/60 bg-emerald-500/12 shadow-[inset_4px_0_0_rgba(52,211,153,0.8),0_4px_16px_rgba(0,0,0,0.2)] text-white font-semibold'
              : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] text-white font-medium'
          )}
        >
          {branch.label}
        </button>
      ))}
    </div>
  )
}
