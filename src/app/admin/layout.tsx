import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/admin/logout/actions'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Don't show nav on login page or when not authenticated
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') ?? ''
  const isLoginPage = pathname === '/admin/login'

  if (!user || isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-ekwa-bg flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-ekwa-border px-6 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-50" style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.92)' }}>
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1B3A6B, #2563EB)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="m-auto">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-ekwa-ink tracking-tight">
              Ekwa <span className="text-ekwa-navy">Dental</span>
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <a
              href="/admin/leads"
              className="flex items-center gap-2 text-sm font-semibold text-ekwa-navy bg-ekwa-bg px-3 py-1.5 rounded-lg"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Leads
            </a>
          </nav>
        </div>

        {/* Right: User + Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
              {user.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-ekwa-ink leading-tight truncate max-w-[160px]">{user.email}</p>
            </div>
          </div>
          <div className="w-px h-5 bg-ekwa-border" />
          <form>
            <button
              formAction={logout}
              className="text-xs text-ekwa-muted hover:text-ekwa-ink transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      {/* Main content — full width */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
