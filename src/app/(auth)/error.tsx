'use client'

import Link from 'next/link'
import { ShieldOff } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ErrorDisplay } from '@/components/error/ErrorDisplay'
import { cn } from '@/lib/utils'

export default function AuthError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorDisplay
      icon={<ShieldOff className="size-8 text-destructive" />}
      title="Your session has expired"
      message="You've been signed out. Sign in again to continue."
      actions={
        <Link href="/login" className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>
          Sign in again
        </Link>
      }
      error={error}
      className="max-w-[360px] pt-24"
    />
  )
}
