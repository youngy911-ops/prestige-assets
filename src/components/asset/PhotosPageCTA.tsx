'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export function PhotosPageCTA({ assetId }: { assetId: string }) {
  const router = useRouter()

  // Prefetch extract page on mount so tapping the CTA feels instant
  useEffect(() => {
    router.prefetch(`/assets/${assetId}/extract?autostart=1`)
  }, [assetId, router])

  return (
    <button
      type="button"
      onClick={() => router.push(`/assets/${assetId}/extract?autostart=1`)}
      className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[15px] transition-all shadow-[0_0_0_1px_rgba(52,211,153,0.3),0_4px_16px_rgba(52,211,153,0.15)] hover:shadow-[0_0_0_1px_rgba(52,211,153,0.5),0_8px_24px_rgba(52,211,153,0.25)]"
    >
      <Sparkles className="w-4 h-4" />
      Extract & Review
    </button>
  )
}
