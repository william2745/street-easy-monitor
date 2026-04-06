'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Monitor } from '@/types/database'

type RunState = 'idle' | 'queued' | 'running' | 'done' | 'failed'

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export default function MonitorControls({ monitor }: { monitor: Monitor }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [runState, setRunState] = useState<RunState>('idle')
  const [runError, setRunError] = useState('')
  const [newMatches, setNewMatches] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimers() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    pollRef.current = null; timeoutRef.current = null
  }

  function startPolling() {
    timeoutRef.current = setTimeout(() => {
      clearTimers(); setRunState('failed'); setRunError('Timed out')
      setTimeout(() => { setRunState('idle'); setRunError('') }, 8000)
    }, 90000)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/monitors/${monitor.id}/run-status`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'succeeded') {
          clearTimers(); setNewMatches(data.new_matches ?? 0); setRunState('done'); router.refresh()
          setTimeout(() => { setRunState('idle'); setNewMatches(null) }, 8000)
        } else if (data.status === 'failed') {
          clearTimers(); setRunState('failed'); setRunError('Failed')
          setTimeout(() => { setRunState('idle'); setRunError('') }, 8000)
        }
      } catch { /* network */ }
    }, 4000)
  }

  async function runNow() {
    clearTimers(); setRunState('queued'); setRunError(''); setNewMatches(null)
    const res = await fetch(`/api/monitors/${monitor.id}/run-now`, { method: 'POST' })
    if (res.ok) { setRunState('running'); startPolling() }
    else { setRunState('failed'); setRunError('Error'); setTimeout(() => { setRunState('idle'); setRunError('') }, 8000) }
  }

  useEffect(() => {
    fetch(`/api/monitors/${monitor.id}/run-status`).then(r => r.json()).then(d => {
      if (d.status === 'running') { setRunState('running'); startPolling() }
    }).catch(() => null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitor.id])

  useEffect(() => () => clearTimers(), [])

  async function toggleActive() {
    setLoading(true)
    await fetch(`/api/monitors/${monitor.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !monitor.is_active }) })
    router.refresh(); setLoading(false)
  }

  async function deleteMonitor() {
    if (!confirm('Delete this monitor and all its matches?')) return
    setLoading(true); await fetch(`/api/monitors/${monitor.id}`, { method: 'DELETE' }); router.push('/monitors')
  }

  const isScanning = runState === 'queued' || runState === 'running'

  function label() {
    if (runState === 'queued') return 'Queuing...'
    if (runState === 'running') return 'Scanning...'
    if (runState === 'done') return newMatches === 0 ? 'No new listings' : `${newMatches} new!`
    if (runState === 'failed') return 'Retry'
    return 'Scan now'
  }

  function scanCls() {
    if (runState === 'failed') return 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
    if (runState === 'done') return newMatches === 0 ? 'bg-warm-200 text-warm-700 border-warm-400' : 'bg-blue-50 text-brand border-brand-medium'
    if (isScanning) return 'bg-brand-light text-brand border-brand-medium'
    return 'bg-brand text-white border-brand hover:bg-brand-hover shadow-sm'
  }

  const btnCls = 'text-sm border border-warm-400 text-warm-700 px-3.5 py-2 rounded-lg hover:bg-warm-200 transition-colors disabled:opacity-50'

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      {isScanning && (
        <div className="w-32 h-1 bg-warm-300 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-brand rounded-full" style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
        </div>
      )}
      {runError && <span className="text-xs text-red-500">{runError}</span>}

      <div className="flex items-center gap-2">
        <button onClick={runNow} disabled={isScanning || loading}
          className={`text-sm px-4 py-2 rounded-lg border font-medium transition-all disabled:cursor-not-allowed flex items-center gap-1.5 ${scanCls()}`}>
          {isScanning && <Spinner />}
          {label()}
        </button>
        <Link href={`/monitors/${monitor.id}/edit`} className={btnCls}>Edit</Link>
        <button onClick={toggleActive} disabled={loading} className={btnCls}>
          {monitor.is_active ? 'Pause' : 'Resume'}
        </button>
        <button onClick={deleteMonitor} disabled={loading}
          className="text-sm border border-warm-400 text-warm-600 px-2.5 py-2 rounded-lg hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
        </button>
      </div>
    </div>
  )
}
