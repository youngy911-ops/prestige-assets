'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { List, Plus, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const assetsActive = pathname === '/'
  const newActive = pathname.startsWith('/assets/new')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-14 bg-[#14532D] border-t border-[#1E3A5F]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-[640px] mx-auto h-full flex items-center justify-around">
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center gap-1 min-h-[44px] justify-center px-6',
            assetsActive ? 'text-white font-semibold' : 'text-white/65'
          )}
        >
          <List className="w-5 h-5" />
          <span className="text-xs">Assets</span>
        </Link>
        <Link
          href="/assets/new"
          className={cn(
            'flex flex-col items-center gap-1 min-h-[44px] justify-center px-6',
            newActive ? 'text-white font-semibold' : 'text-white/65'
          )}
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs">New Asset</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 min-h-[44px] justify-center px-6 text-white/65"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs">Logout</span>
        </button>
      </div>
    </nav>
  )
}
