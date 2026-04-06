'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-1.5 mb-8">
          <div className="w-5 h-5 bg-violet-500 rounded flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          </div>
          <span className="font-semibold text-[14px] text-white">StreetSnipe</span>
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h1 className="text-[15px] font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-[13px] text-zinc-500 mb-5">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-zinc-400 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-zinc-400 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors" />
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-md px-3 py-1.5 text-[12px] text-red-400">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 text-white py-2 rounded-md text-[13px] font-medium hover:bg-violet-500 transition-colors disabled:opacity-50 mt-1">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-zinc-500 mt-5">
          No account? <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
