'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { List, Plus, Zap, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  // Hide nav on the report page — it has its own toolbar and print layout
  if (pathname.endsWith('/report')) return null

  const assetsActive = pathname === '/'
  const newActive = pathname.startsWith('/assets/new')
  const quickActive = pathname.startsWith('/assets/quick')

  async function handleLogout() {
    if (!confirmingLogout) {
      setConfirmingLogout(true)
      setTimeout(() => setConfirmingLogout(false), 3000)
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="max-w-[640px] w-full mx-4 mb-2 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/[0.10] shadow-[0_-4px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] pointer-events-auto h-14 flex items-center justify-around">
        <Link
          href="/"
          aria-current={assetsActive ? 'page' : undefined}
          className={cn(
            'flex flex-col items-center gap-1 min-h-[44px] justify-center px-6 transition-colors',
            assetsActive ? 'text-white' : 'text-white/40 hover:text-white/70'
          )}
        >
          <List className={cn('w-5 h-5', assetsActive && 'text-emerald-400')} />
          <span className={cn('text-xs font-medium', assetsActive ? 'text-white' : 'text-white/40')}>Assets</span>
        </Link>
        <Link
          href="/assets/new"
          aria-current={newActive ? 'page' : undefined}
          className={cn(
            'flex flex-col items-center gap-1 min-h-[44px] justify-center px-6 transition-colors',
            newActive ? 'text-white' : 'text-white/40 hover:text-white/70'
          )}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-colors', newActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.4)]' : 'bg-white/10')}>
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className={cn('text-xs font-medium', newActive ? 'text-white' : 'text-white/40')}>New</span>
        </Link>
        <Link
          href="/assets/quick"
          aria-current={quickActive ? 'page' : undefined}
          className={cn(
            'flex flex-col items-center gap-1 min-h-[44px] justify-center px-6 transition-colors',
            quickActive ? 'text-white' : 'text-white/40 hover:text-white/70'
          )}
        >
          <Zap className={cn('w-5 h-5', quickActive && 'text-emerald-400')} />
          <span className={cn('text-xs font-medium', quickActive ? 'text-white' : 'text-white/40')}>Quick</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'flex flex-col items-center gap-1 min-h-[44px] justify-center px-4 transition-colors',
            confirmingLogout ? 'text-red-400' : 'text-white/40 hover:text-white/70'
          )}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-medium">{confirmingLogout ? 'Confirm?' : 'Logout'}</span>
        </button>
      </div>
    </nav>
  )
}
