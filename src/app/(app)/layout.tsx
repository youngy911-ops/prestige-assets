import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/nav/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen bg-background" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 50%, transparent 75%), var(--background)' }}>
      <main className="pb-[calc(env(safe-area-inset-bottom)+56px)] overscroll-none">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
