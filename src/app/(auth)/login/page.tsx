import { LoginForm } from '@/components/auth/LoginForm'
import { BRAND } from '@/lib/constants/brand'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] flex flex-col gap-6">
        <div className="text-center mb-2">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-2xl scale-150" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_0_1px_rgba(52,211,153,0.4),0_8px_32px_rgba(52,211,153,0.3)]">
              <span className="text-2xl font-black text-white tracking-tight">{BRAND.logoMonogram}</span>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
            {BRAND.name}
          </h1>
          <p className="text-white/40 text-sm mt-1 font-medium">Asset Book-In</p>
        </div>
        <div className="bg-white/[0.03] rounded-3xl border border-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_32px_64px_rgba(0,0,0,0.4)] p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
