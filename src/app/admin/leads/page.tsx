import { createClient } from '@/lib/supabase/server'
import LeadsDashboard from './components/LeadsDashboard'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('captured_at', { ascending: false })

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-ekwa-ink">Failed to load leads</p>
          <p className="text-xs text-ekwa-muted mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return <LeadsDashboard initialLeads={leads ?? []} />
}
