import { LoginForm } from '@/components/auth/LoginForm'
import { BRAND } from '@/lib/constants/brand'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/8 blur-[120px]" />
      </div>
      <div className="w-full max-w-[380px] flex flex-col gap-6">
        <div className="text-center mb-2">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-2xl scale-150" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_0_1px_rgba(52,211,153,0.4),0_8px_32px_rgba(52,211,153,0.3)]">
              <span className="text-2xl font-black text-white tracking-tight">{BRAND.logoMonogram}</span>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mt-5">
            {BRAND.name}
          </h1>
          <p className="text-sm font-medium text-emerald-400/70 mt-1">Asset Book-In</p>
          <p className="text-xs text-white/30 mt-2">Log in to start booking in assets</p>
        </div>
        <div className="bg-white/[0.03] rounded-3xl border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_40px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.3)] p-7">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
