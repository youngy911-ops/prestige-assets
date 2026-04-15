'use client'
import { useRouter } from 'next/navigation'

export function PhotosPageCTA({ assetId }: { assetId: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/assets/${assetId}/extract?autostart=1`)}
      className="flex items-center justify-center w-full h-11 rounded-md bg-emerald-600 hover:bg-emerald-600/90 text-white font-medium text-sm transition-colors"
    >
      Run AI Extraction
    </button>
  )
}
