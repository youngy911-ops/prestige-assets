'use client'

import Link from 'next/link'
import { AlertTriangle, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { ErrorDisplay } from '@/components/error/ErrorDisplay'
import { cn } from '@/lib/utils'

function classifyError(error: Error): 'auth' | 'asset' | 'server' {
  const msg = error.message?.toLowerCase() ?? ''
  if (msg.includes('auth') || msg.includes('session') || msg.includes('unauthorized')) return 'auth'
  if (msg.includes('asset') || msg.includes('not found') || msg.includes('load')) return 'asset'
  return 'server'
}

const ERROR_CONFIG = {
  auth: {
    icon: <ShieldOff className="size-8 text-destructive" />,
    title: 'Your session has expired',
    message: "You've been signed out. Sign in again to continue.",
  },
  asset: {
    icon: <AlertTriangle className="size-8 text-destructive" />,
    title: "This asset couldn't be loaded",
    message: 'The asset may have been deleted or an error occurred. Try again or return to your assets.',
  },
  server: {
    icon: <AlertTriangle className="size-8 text-destructive" />,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Try again — if the problem persists, contact support.',
  },
} as const

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const type = classifyError(error)
  const config = ERROR_CONFIG[type]

  const actions = type === 'auth' ? (
    <Link href="/login" className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>
      Sign in again
    </Link>
  ) : type === 'asset' ? (
    <>
      <Link href="/assets" className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>
        Go to Assets
      </Link>
      <Button variant="outline" size="lg" onClick={reset}>Try Again</Button>
    </>
  ) : (
    <>
      <Button variant="outline" size="lg" onClick={reset}>Try Again</Button>
      <Link href="/assets" className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>
        Go to Assets
      </Link>
    </>
  )

  return (
    <ErrorDisplay
      icon={config.icon}
      title={config.title}
      message={config.message}
      actions={actions}
      error={error}
      className="max-w-[480px] pt-16"
    />
  )
}
