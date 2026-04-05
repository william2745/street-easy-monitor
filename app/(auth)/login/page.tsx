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
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
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
          <h1 className="font-serif text-2xl text-[#2C2420] mb-6">Sign in</h1>

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
                className="w-full border border-[#E8E0D5] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2420] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4703A]/30 focus:border-[#C4703A]"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C4703A] text-white py-2.5 rounded-full text-sm font-medium hover:bg-[#A85C2E] transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B5E52] mt-6">
          No account?{' '}
          <Link href="/signup" className="text-[#C4703A] hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
