'use client'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export function PhotosPageCTA({ assetId }: { assetId: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/assets/${assetId}/extract?autostart=1`)}
      className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
    >
      <Sparkles className="w-4 h-4" />
      Extract & Review
    </button>
  )
}
