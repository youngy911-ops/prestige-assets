import Link from 'next/link'

export default function AssetsPage() {
  return (
    <div className="max-w-[640px] mx-auto px-4 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Assets</h1>
        <Link
          href="/assets/new"
          className="inline-flex items-center justify-center bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-white h-11 px-4 rounded-lg font-medium text-sm transition-colors"
        >
          New Asset
        </Link>
      </div>
      <div className="text-center py-16">
        <p className="text-white text-base font-medium">No assets yet</p>
        <p className="text-white/65 text-sm mt-2">Tap New Asset to start booking in an asset.</p>
      </div>
    </div>
  )
}
