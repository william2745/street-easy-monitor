'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (signUpError) {
      setError(signUpError.message.toLowerCase().includes('security') ? 'Please wait a moment before trying again.' : signUpError.message)
      setLoading(false); return
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) router.push('/login?created=1')
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-warm-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          </div>
          <span className="font-serif text-xl text-warm-900">StreetSnipe</span>
        </Link>

        <div className="bg-warm-50 rounded-xl p-8 border border-warm-400 shadow-sm">
          <h1 className="font-serif text-2xl text-warm-900 mb-1">Create your account</h1>
          <p className="text-sm text-warm-700 mb-6">Free to start. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-warm-400 rounded-lg px-4 py-3 text-sm text-warm-900 bg-white placeholder:text-warm-600 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wide mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full border border-warm-400 rounded-lg px-4 py-3 text-sm text-warm-900 bg-white placeholder:text-warm-600 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                placeholder="8+ characters" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-brand text-white py-3 rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50 shadow-sm">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-warm-700 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand hover:text-brand-hover font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
