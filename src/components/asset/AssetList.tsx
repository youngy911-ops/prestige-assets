'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronDown, Search, X, Plus, Zap, Package } from 'lucide-react'
import { BRANCHES, type BranchKey } from '@/lib/constants/branches'
import { getAssets, getAssetThumbs, getTodayBookingCount, type AssetSummary } from '@/lib/actions/asset.actions'
import { SCHEMA_REGISTRY } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry'
import { AssetCard } from './AssetCard'

const LAST_BRANCH_KEY = 'lastUsedBranch'

interface AssetListProps {
  branch: BranchKey
  onBranchChange: (branch: BranchKey) => void
  initialAssets?: AssetSummary[] | null
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

export function AssetList({ branch, onBranchChange, initialAssets }: AssetListProps) {
  const router = useRouter()
  const [assets, setAssets] = useState<AssetSummary[] | null>(initialAssets ?? null)
  const [showBookInMenu, setShowBookInMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [changingBranch, setChangingBranch] = useState(false)
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'reviewed' | 'confirmed'>('all')
  const [sortNewest, setSortNewest] = useState(true)
  const isFirstRender = useRef(true)

  useEffect(() => {
    getTodayBookingCount().then(setTodayCount)
  }, [])

  useEffect(() => {
    // First render: skip fetch if server pre-loaded assets — they're already in state
    if (isFirstRender.current) {
      isFirstRender.current = false
      if (initialAssets != null) return
    }
    setAssets(null)
    setError(null)
    getAssets(branch).then(result => {
      if ('error' in result) {
        setError(result.error)
      } else {
        setAssets(result)
      }
    })
  }, [branch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Deferred thumbnail loading — fires after list renders so it never blocks first paint
  useEffect(() => {
    if (!assets || assets.length === 0) return
    const ids = assets.map(a => a.id)
    getAssetThumbs(ids).then(thumbs => {
      if (Object.keys(thumbs).length === 0) return
      setAssets(prev =>
        prev?.map(a => ({ ...a, thumb_url: thumbs[a.id] ?? a.thumb_url })) ?? prev
      )
    })
  }, [assets?.map(a => a.id).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAssetDeleted(assetId: string) {
    setAssets(prev => prev?.filter(a => a.id !== assetId) ?? prev)
  }

  const branchLabel = BRANCHES.find(b => b.key === branch)?.label ?? branch

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Assets</h1>
          {todayCount !== null && todayCount > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">{todayCount} today</span>
            </div>
          )}
        </div>

        {/* Book In button + dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBookInMenu(v => !v)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Book In
          </button>
          {showBookInMenu && (
            <>
              {/* Backdrop to close */}
              <div className="fixed inset-0 z-10" onClick={() => setShowBookInMenu(false)} />
              <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-white/[0.10] bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => { setShowBookInMenu(false); router.push('/assets/new') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/[0.06] transition-colors border-b border-white/[0.06]"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">New Asset</p>
                    <p className="text-xs text-white/45">Full photos + auto extract</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowBookInMenu(false); router.push('/assets/quick') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Quick Book</p>
                    <p className="text-xs text-white/45">Snap a photo, fill later</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search — always visible */}
      {!changingBranch && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="search"
            placeholder="Search assets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-white/[0.10] bg-white/[0.03] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
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

      {/* Asset type breakdown */}
      {!changingBranch && assets && assets.length > 0 && (() => {
        const counts: Record<string, number> = {}
        for (const a of assets) {
          counts[a.asset_type] = (counts[a.asset_type] ?? 0) + 1
        }
        const parts = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => {
            const label = SCHEMA_REGISTRY[type as AssetType]?.displayName ?? type
            return `${count} ${label.toLowerCase()}${count !== 1 ? 's' : ''}`
          })
        return parts.length > 0 ? (
          <p className="text-xs text-white/30 mb-3">{parts.join(' \u00b7 ')}</p>
        ) : null
      })()}

      {/* Branch chip + sort */}
      {!changingBranch && (
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setChangingBranch(true)}
            className="inline-flex items-center gap-1 text-sm text-white/65 hover:text-white transition-colors border border-white/[0.12] rounded-lg px-3 py-1.5"
          >
            {branchLabel}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSortNewest(v => !v)}
            className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/70 transition-colors border border-white/[0.12] rounded-lg px-2.5 py-1.5 min-h-[36px]"
            title={sortNewest ? 'Sorted newest first' : 'Sorted oldest first'}
          >
            {sortNewest ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
            <span className="text-xs">{sortNewest ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      )}

      {changingBranch && (
        <div className="flex flex-col gap-2 mb-4">
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
      )}

      {/* Status filter chips */}
      {!changingBranch && (
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'draft', 'reviewed', 'confirmed'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-medium rounded-full px-3 min-h-[36px] transition-colors ${
                statusFilter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/[0.05] text-white/50 hover:text-white/70'
              }`}
            >
              {s === 'all' ? 'All' : s === 'draft' ? 'Draft' : s === 'reviewed' ? 'Reviewed' : 'Confirmed'}
            </button>
          ))}
        </div>
      )}

      {/* List states */}
      {error && (
        <div className="text-center py-16">
          <p className="text-white text-base font-medium">Could not load assets.</p>
          <p className="text-white/65 text-sm mt-2">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setAssets(null)
              getAssets(branch).then(result => {
                if ('error' in result) {
                  setError(result.error)
                } else {
                  setAssets(result)
                }
              })
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!error && assets === null && (
        <div className="text-center py-16">
          <p className="text-white/65 text-sm">Loading...</p>
        </div>
      )}

      {!error && assets !== null && assets.length === 0 && (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
            <Package className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-white text-lg font-semibold">Ready to book in</h2>
          <p className="text-white/50 text-sm mt-2 max-w-[280px]">Snap photos, details extracted automatically, paste to Salesforce.</p>
          <div className="flex items-center gap-3 mt-6">
            <Link
              href="/assets/new"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Asset
            </Link>
            <Link
              href="/assets/quick"
              className="inline-flex items-center gap-2 border border-white/[0.15] hover:border-white/[0.25] text-white/70 hover:text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Zap className="w-4 h-4" />
              Quick Book
            </Link>
          </div>
        </div>
      )}

      {!error && assets !== null && assets.length > 0 && (() => {
        const filtered = assets
          .filter(a => matchesSearch(a, search))
          .filter(a => statusFilter === 'all' || a.status === statusFilter)
          .sort((a, b) => {
            const diff = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
            return sortNewest ? -diff : diff
          })
        const isFiltering = statusFilter !== 'all' || search.trim() !== ''
        const countLabel = statusFilter === 'draft'
          ? `${filtered.length} draft${filtered.length !== 1 ? 's' : ''}`
          : statusFilter === 'reviewed'
          ? `${filtered.length} reviewed`
          : statusFilter === 'confirmed'
          ? `${filtered.length} confirmed`
          : `${filtered.length} asset${filtered.length !== 1 ? 's' : ''}`
        return filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-white/65 text-sm">No assets match your filters</p>
            <button type="button" onClick={() => { setSearch(''); setStatusFilter('all') }} className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 transition-colors">Clear filters</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            {isFiltering && (
              <p className="text-xs text-white/40">{countLabel}</p>
            )}
            {filtered.map((asset, i) => (
              <AssetCard
                key={asset.id}
                id={asset.id}
                asset_type={asset.asset_type}
                asset_subtype={asset.asset_subtype}
                fields={(asset.fields ?? {}) as Record<string, string>}
                status={asset.status}
                updated_at={asset.updated_at}
                thumb_url={asset.thumb_url}
                animationDelay={`${i * 50}ms`}
                onDeleted={handleAssetDeleted}
              />
            ))}
          </div>
        )
      })()}
    </div>
  )
}
