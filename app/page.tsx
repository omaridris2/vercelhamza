'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
        setLoading(false)
        return
      }

      const user = data.user
      if (!user) {
        setMessage('No user returned from login')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setMessage(`Error fetching profile: ${profileError.message}`)
        setLoading(false)
        return
      }

      setMessage('Login successful! Redirecting...')

      if (profile?.role === 'Admin') {
        router.push('/admin')
      } else {
        router.push('/home')
      }
    } catch (err) {
      setMessage('An unexpected error occurred')
      console.error('⚠️ Login error:', err)
    }

    setLoading(false)
  }

  return (
    <main className="flex justify-center items-center min-h-screen font-sans">
      <div className="flex flex-col items-center">
        {/* Logo on top */}
        <img
          src="/logo.svg"
          alt="Logo"
          width={200}
          height={200}
          className="mb-6"
        />

        {/* Login box below */}
        <div className="w-100 max-w-sm p-8 border border-slate-200 rounded-lg shadow-md">
          <h1 className="text-center text-2xl font-semibold mb-8">Login</h1>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 text-white font-medium rounded-md text-base transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#636254] hover:bg-[#545447] cursor-pointer'
              }`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-md border ${
                message.includes('Error')
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
