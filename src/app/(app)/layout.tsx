import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/nav/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen bg-background" style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.03) 40%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(16,185,129,0.04) 0%, transparent 60%), var(--background)' }}>
      <main className="pb-[calc(env(safe-area-inset-bottom)+56px)]">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
