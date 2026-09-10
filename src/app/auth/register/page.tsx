'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'spectator' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error || 'Registration failed'); return }
    toast.success('Account created! Please sign in.')
    router.push('/auth/login')
  }

  return (
    <div className="page-gradient min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏓</div>
          <div className="text-2xl font-bold text-white">Create Account</div>
          <div className="text-white/40 text-sm mt-2">Join PinoyPicklers</div>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Juan dela Cruz' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-white/50 mb-2">{label}</label>
              <input type={type} value={(form as any)[key]} placeholder={placeholder}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="input-field" required />
            </div>
          ))}

          <div>
            <label className="block text-xs text-white/50 mb-2">I want to join as</label>
            <div className="grid grid-cols-2 gap-2">
              {[['player', '🏓 Player'], ['spectator', '👁️ Spectator']].map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => setForm(f => ({ ...f, role: val }))}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    form.role === val
                      ? 'bg-brand-green/20 border-brand-green text-brand-green'
                      : 'bg-white/5 border-white/10 text-white/50'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-green hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
