'use client'

interface PaginationProps {
  currentPage: number
  totalItems: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rows: number) => void
}

const rowOptions = [10, 25, 50]

export default function Pagination({
  currentPage,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const endItem = Math.min(currentPage * rowsPerPage, totalItems)

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | 'ellipsis')[] = [1]
    if (currentPage > 3) pages.push('ellipsis')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-ekwa-border bg-white rounded-b-xl">
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-ekwa-muted">Rows per page</span>
        <select
          value={rowsPerPage}
          onChange={e => {
            onRowsPerPageChange(Number(e.target.value))
            onPageChange(1)
          }}
          className="text-xs text-ekwa-ink bg-ekwa-bg border border-ekwa-border rounded-md px-2 py-1.5 focus:outline-none focus:border-ekwa-navy transition-colors"
        >
          {rowOptions.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Info + nav */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-ekwa-muted">
          {startItem}–{endItem} of {totalItems}
        </span>

        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ekwa-muted hover:bg-ekwa-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {/* Page numbers */}
          {getVisiblePages().map((page, i) =>
            page === 'ellipsis' ? (
              <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-ekwa-light">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                  page === currentPage
                    ? 'bg-ekwa-navy text-white'
                    : 'text-ekwa-muted hover:bg-ekwa-bg'
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ekwa-muted hover:bg-ekwa-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
