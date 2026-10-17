import { useState } from 'react'
import { Sun, User, Lock, Eye, EyeOff } from 'lucide-react'
import { authenticate, useAuth } from '../utils/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const user = authenticate(username, password)
    if (!user) return setError('Invalid ID or password')
    login(user)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sun-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="relative flex items-center gap-3 text-2xl font-extrabold">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sun-400 to-orange-500"><Sun /></div>
          ZX Solar CRM
        </div>
        <img src="/solar-hero.svg" alt="Solar panels under the sun" className="relative mx-auto w-full max-w-md animate-float drop-shadow-2xl" />
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">Leads, attendance &amp;<br />solar service — one place.</h2>
          <p className="mt-4 max-w-md text-blue-100">Manage every lead source, assign work fairly, and keep every quarterly solar maintenance on schedule with OTP-verified visits.</p>
        </div>
        <p className="relative text-sm text-blue-200">© ZX Solar</p>
      </div>

      <div className="flex items-center justify-center bg-gradient-to-br from-white to-brand-50 p-6">
        <div className="card w-full max-w-md animate-fadeUp !bg-white !p-8 shadow-lift">
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">Sign in with your ID and password</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">User ID</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input !pl-10" autoFocus autoComplete="username" value={username} onChange={(e) => { setUsername(e.target.value); setError('') }} placeholder="Enter your ID" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input !px-10" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} placeholder="Enter your password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Toggle password">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>}
            <button type="submit" className="btn-primary w-full !py-2.5">Sign in</button>
          </form>
        </div>
      </div>
    </div>
  )
}
