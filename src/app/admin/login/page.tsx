import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/admin/leads')
  }

  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#dce6f5' }}>
      <div className="flex w-full max-w-[900px] min-h-[480px] rounded-2xl overflow-hidden shadow-xl">
        {/* Left panel — gradient branding */}
        <div
          className="hidden md:flex md:w-1/2 flex-col justify-end p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #2563EB 0%, #1B3A6B 100%)' }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10"
            style={{ border: '2px solid rgba(255,255,255,0.5)' }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full opacity-10"
            style={{ border: '2px solid rgba(255,255,255,0.4)' }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight leading-tight">
              Ekwa Dental
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Your leads dashboard. In full view.
            </p>
            <a
              href="/"
              className="inline-block mt-5 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors px-5 py-2 rounded-full"
            >
              Read More
            </a>
          </div>
        </div>

        {/* Right panel — login form */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-10 py-12">
          <h1 className="text-2xl font-bold text-ekwa-ink">Hello Again!</h1>
          <p className="text-ekwa-muted text-sm mt-1 mb-8">Welcome Back</p>

          {params.error && (
            <p className="text-sm text-ekwa-rose mb-4">
              Invalid email or password. Please try again.
            </p>
          )}

          <form className="space-y-5">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ekwa-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email Address"
                className="w-full border border-ekwa-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-ekwa-ink placeholder:text-ekwa-light focus:outline-none focus:ring-2 focus:ring-ekwa-blue/40 focus:border-ekwa-blue transition-colors"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ekwa-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                className="w-full border border-ekwa-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-ekwa-ink placeholder:text-ekwa-light focus:outline-none focus:ring-2 focus:ring-ekwa-blue/40 focus:border-ekwa-blue transition-colors"
              />
            </div>

            <button
              formAction={login}
              className="w-full text-white py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1B3A6B)' }}
            >
              Login
            </button>
          </form>

          <p className="text-center text-xs text-ekwa-muted mt-5 cursor-pointer hover:text-ekwa-ink transition-colors">
            Forgot Password
          </p>
        </div>
      </div>
    </div>
  )
}
