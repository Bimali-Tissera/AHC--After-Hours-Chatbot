'use client'

import type { Lead } from '@/lib/supabase/types'

interface ExportButtonProps {
  leads: Lead[]
}

export default function ExportButton({ leads }: ExportButtonProps) {
  const handleExport = () => {
    if (leads.length === 0) return

    const headers = ['Name', 'Phone', 'Email', 'Status', 'Trigger Question', 'Date']
    const rows = leads.map(lead => [
      lead.name ?? '',
      lead.phone ?? '',
      lead.email ?? '',
      lead.status,
      lead.trigger_question ?? '',
      new Date(lead.captured_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={leads.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-ekwa-navy bg-white border border-ekwa-border rounded-lg hover:bg-ekwa-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Download CSV
    </button>
  )
}
