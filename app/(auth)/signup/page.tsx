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
    setLoading(true)
    setError('')

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (signUpError) {
      // Supabase rate limit message is confusing — simplify it
      if (signUpError.message.toLowerCase().includes('security purposes') ||
          signUpError.message.toLowerCase().includes('after')) {
        setError('Please wait a moment before trying again.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    // Auto sign-in after signup
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      // Account created but couldn't auto-login — send to login
      router.push('/login?created=1')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-serif text-2xl text-[#2C2420] mb-10">
          StreetSnipe
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <h1 className="font-serif text-2xl text-[#2C2420] mb-2">Create your account</h1>
          <p className="text-sm text-[#6B5E52] mb-6">Free to start. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6B5E52] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-[#E8E0D5] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2420] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4703A]/30 focus:border-[#C4703A]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B5E52] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-[#E8E0D5] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2420] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4703A]/30 focus:border-[#C4703A]"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C4703A] text-white py-2.5 rounded-full text-sm font-medium hover:bg-[#A85C2E] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B5E52] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#C4703A] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
