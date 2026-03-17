import { Loader2, AlertCircle } from 'lucide-react'

interface UploadProgressIndicatorProps {
  isUploading: boolean
  error?: string | null
}

export function UploadProgressIndicator({ isUploading, error }: UploadProgressIndicatorProps) {
  if (!isUploading && !error) return null

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center rounded-md ${
        error
          ? 'bg-[#F87171]/60'
          : 'bg-black/50'
      }`}
    >
      {error ? (
        <AlertCircle className="w-6 h-6 text-white" />
      ) : (
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      )}
    </div>
  )
}
