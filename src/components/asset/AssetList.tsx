'use client'
import { useEffect, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { BRANCHES, type BranchKey } from '@/lib/constants/branches'
import { getAssets, getTodayBookingCount, type AssetSummary } from '@/lib/actions/asset.actions'
import { AssetCard } from './AssetCard'

const LAST_BRANCH_KEY = 'lastUsedBranch'

interface AssetListProps {
  branch: BranchKey
  onBranchChange: (branch: BranchKey) => void
}

function matchesSearch(asset: AssetSummary, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  const haystack = [
    asset.asset_type,
    asset.asset_subtype ?? '',
    ...Object.values(asset.fields ?? {}),
  ].join(' ').toLowerCase()
  return haystack.includes(q)
}

export function AssetList({ branch, onBranchChange }: AssetListProps) {
  const [assets, setAssets] = useState<AssetSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [changingBranch, setChangingBranch] = useState(false)
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getTodayBookingCount().then(setTodayCount)
  }, [])

  useEffect(() => {
    setAssets(null)
    setError(null)
    getAssets(branch).then(result => {
      if ('error' in result) {
        setError(result.error)
      } else {
        setAssets(result)
      }
    })
  }, [branch])

  const branchLabel = BRANCHES.find(b => b.key === branch)?.label ?? branch

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Assets</h1>
        {todayCount !== null && todayCount > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              {todayCount} booked today
            </span>
          </div>
        )}
      </div>

      {/* Branch header chip */}
      <div className="mb-6">
        {changingBranch ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-white/65 mb-2">Select branch:</p>
            {BRANCHES.map(b => (
              <button
                key={b.key}
                type="button"
                onClick={() => {
                  localStorage.setItem(LAST_BRANCH_KEY, b.key)
                  onBranchChange(b.key as BranchKey)
                  setChangingBranch(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-base text-white transition-all min-h-[48px] border ${
                  b.key === branch
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                {b.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setChangingBranch(false)}
              className="text-sm text-white/65 mt-2 underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setChangingBranch(true)}
            className="inline-flex items-center gap-1 text-sm text-white/65 hover:text-white transition-colors border border-white/[0.12] rounded-lg px-3 py-1.5"
          >
            {branchLabel}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search */}
      {assets !== null && assets.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="search"
            placeholder="Search make, model, type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-white/[0.10] bg-white/[0.03] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* List states */}
      {error && (
        <div className="text-center py-16">
          <p className="text-white text-base font-medium">Could not load assets.</p>
          <p className="text-white/65 text-sm mt-2">Check your connection and refresh.</p>
        </div>
      )}

      {!error && assets === null && (
        <div className="text-center py-16">
          <p className="text-white/65 text-sm">Loading...</p>
        </div>
      )}

      {!error && assets !== null && assets.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white text-base font-medium">No assets yet</p>
          <p className="text-white/65 text-sm mt-2">Tap New Asset to start booking in an asset.</p>
        </div>
      )}

      {!error && assets !== null && assets.length > 0 && (() => {
        const filtered = assets.filter(a => matchesSearch(a, search))
        return filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-white/65 text-sm">No assets match &ldquo;{search}&rdquo;</p>
            <button type="button" onClick={() => setSearch('')} className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 transition-colors">Clear search</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(asset => (
              <AssetCard
                key={asset.id}
                id={asset.id}
                asset_type={asset.asset_type}
                asset_subtype={asset.asset_subtype}
                fields={(asset.fields ?? {}) as Record<string, string>}
                status={asset.status}
                updated_at={asset.updated_at}
              />
            ))}
          </div>
        )
      })()}
    </div>
  )
}
