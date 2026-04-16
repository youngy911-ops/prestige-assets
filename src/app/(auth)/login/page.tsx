import { LoginForm } from '@/components/auth/LoginForm'
import { BRAND } from '@/lib/constants/brand'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] flex flex-col gap-6">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-5 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <span className="text-2xl font-black text-white tracking-tight">{BRAND.logoMonogram}</span>
          </div>
          <h1 className="text-[26px] font-bold text-white leading-tight tracking-tight">
            {BRAND.name}
          </h1>
          <p className="text-white/40 text-sm mt-1 font-medium">Asset Book-In</p>
        </div>
        <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
