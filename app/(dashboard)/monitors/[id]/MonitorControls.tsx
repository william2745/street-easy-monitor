'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Monitor } from '@/types/database'

type RunState = 'idle' | 'queued' | 'running' | 'done' | 'failed'

export default function MonitorControls({ monitor }: { monitor: Monitor }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [runState, setRunState] = useState<RunState>('idle')
  const [runError, setRunError] = useState('')
  const [newMatches, setNewMatches] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearTimers() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    pollRef.current = null
    timerRef.current = null
  }

  function startPolling() {
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/monitors/${monitor.id}/run-status`)
        if (!res.ok) return
        const data = await res.json()

        if (data.status === 'succeeded') {
          clearTimers()
          setNewMatches(data.new_matches ?? 0)
          setRunState('done')
          router.refresh()
          setTimeout(() => { setRunState('idle'); setNewMatches(null) }, 8000)
        } else if (data.status === 'failed') {
          clearTimers()
          setRunState('failed')
          setRunError('Scan failed — try again')
          setTimeout(() => { setRunState('idle'); setRunError('') }, 8000)
        }
        // still 'running' → keep polling
      } catch {
        // network blip, keep polling
      }
    }, 4000)
  }

  async function runNow() {
    clearTimers()
    setRunState('queued')
    setRunError('')
    setNewMatches(null)

    const res = await fetch(`/api/monitors/${monitor.id}/run-now`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setRunState('running')
      startPolling()
    } else {
      setRunState('failed')
      setRunError(data.error ?? 'Unknown error')
      setTimeout(() => { setRunState('idle'); setRunError('') }, 10000)
    }
  }

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [])

  async function toggleActive() {
    setLoading(true)
    await fetch(`/api/monitors/${monitor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !monitor.is_active }),
    })
    router.refresh()
    setLoading(false)
  }

  async function deleteMonitor() {
    if (!confirm('Delete this monitor? All match history will be removed.')) return
    setLoading(true)
    await fetch(`/api/monitors/${monitor.id}`, { method: 'DELETE' })
    router.push('/monitors')
  }

  const isScanning = runState === 'queued' || runState === 'running'

  function checkNowLabel() {
    if (runState === 'queued') return 'Queuing…'
    if (runState === 'running') return `Scanning… ${elapsed}s`
    if (runState === 'done') return newMatches === 0 ? 'No new matches' : `${newMatches} new match${newMatches === 1 ? '' : 'es'} ✓`
    if (runState === 'failed') return 'Failed — retry?'
    return 'Check now'
  }

  function checkNowClass() {
    if (runState === 'failed') return 'bg-red-100 text-red-600 border border-red-200'
    if (runState === 'done') return newMatches === 0 ? 'bg-[#F0EBE1] text-[#6B5E52]' : 'bg-[#E8F5E9] text-green-700'
    if (isScanning) return 'bg-[#F5E8DC] text-[#C4703A] opacity-80'
    return 'bg-[#F5E8DC] text-[#C4703A] hover:bg-[#EDD9C6]'
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      {/* Progress bar */}
      {isScanning && (
        <div className="w-48 h-1 bg-[#F0EBE1] rounded-full overflow-hidden">
          <div className="h-full bg-[#C4703A] rounded-full animate-[scan_2s_ease-in-out_infinite]"
            style={{ width: '60%', animation: 'pulse-bar 1.8s ease-in-out infinite' }} />
        </div>
      )}

      {runError && (
        <p className="text-xs text-red-500 max-w-xs text-right">{runError}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={runNow}
          disabled={isScanning || loading}
          className={`text-sm px-4 py-2 rounded-full transition-colors disabled:cursor-not-allowed ${checkNowClass()}`}
        >
          {checkNowLabel()}
        </button>
        <Link
          href={`/monitors/${monitor.id}/edit`}
          className="text-sm border border-[#E8E0D5] text-[#6B5E52] px-4 py-2 rounded-full hover:bg-[#F0EBE1] transition-colors"
        >
          Edit
        </Link>
        <button
          onClick={toggleActive}
          disabled={loading}
          className="text-sm border border-[#E8E0D5] text-[#6B5E52] px-4 py-2 rounded-full hover:bg-[#F0EBE1] transition-colors disabled:opacity-50"
        >
          {monitor.is_active ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={deleteMonitor}
          disabled={loading}
          className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
