import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#166534] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-[28px] font-semibold text-white leading-[1.15]">
            Slattery Auctions
          </h1>
          <p className="text-white/65 text-sm mt-1">Book-in tool</p>
        </div>
        <div className="bg-[#14532D] rounded-lg p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
