'use client'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-[360px] mx-auto px-4 pt-24 text-center">
      <p className="text-white text-base font-semibold">Something went wrong</p>
      <p className="text-white/50 text-sm mt-2">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center justify-center h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
