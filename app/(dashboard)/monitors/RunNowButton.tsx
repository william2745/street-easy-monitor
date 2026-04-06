'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RunNowButton({ monitorId }: { monitorId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'queued' | 'error'>('idle')

  async function handleRunNow(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setLoading(true); setStatus('idle')
    const res = await fetch(`/api/monitors/${monitorId}/run-now`, { method: 'POST' })
    setLoading(false)
    if (res.ok) { setStatus('queued'); router.refresh(); setTimeout(() => setStatus('idle'), 6000) }
    else { setStatus('error'); setTimeout(() => setStatus('idle'), 6000) }
  }

  return (
    <button
      onClick={handleRunNow}
      disabled={loading}
      className={`shrink-0 text-xs px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 font-medium ${
        status === 'error'
          ? 'text-red-500 bg-red-50 border border-red-200'
          : status === 'queued'
          ? 'text-brand bg-brand-light border border-brand-medium'
          : 'text-warm-600 hover:text-brand hover:bg-brand-light border border-warm-400 hover:border-brand-medium'
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-1">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          Scanning
        </span>
      ) : status === 'queued' ? 'Queued' : status === 'error' ? 'Failed' : 'Scan'}
    </button>
  )
}
