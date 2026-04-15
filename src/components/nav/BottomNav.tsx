'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { List, Plus, Zap, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const assetsActive = pathname === '/'
  const newActive = pathname.startsWith('/assets/new')
  const quickActive = pathname.startsWith('/assets/quick')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/[0.08]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-[640px] mx-auto h-14 flex items-center justify-around">
        <Link
          href="/"
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
          className={cn(
            'flex flex-col items-center gap-1 min-h-[44px] justify-center px-6 transition-colors',
            newActive ? 'text-white' : 'text-white/40 hover:text-white/70'
          )}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-colors', newActive ? 'bg-emerald-500' : 'bg-white/10')}>
            <Plus className="w-5 h-5 text-white" />
          </div>
        </Link>
        <Link
          href="/assets/quick"
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
          className="flex flex-col items-center gap-1 min-h-[44px] justify-center px-4 text-white/40 hover:text-white/70 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  )
}
