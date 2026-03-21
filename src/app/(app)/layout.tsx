import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/nav/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen bg-[#166534]">
      <main className="pb-[calc(env(safe-area-inset-bottom)+56px)]">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
