'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-[480px] mx-auto px-4 pt-16 text-center">
      <p className="text-white text-lg font-semibold">Something went wrong</p>
      <p className="text-white/50 text-sm mt-2">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center justify-center h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
