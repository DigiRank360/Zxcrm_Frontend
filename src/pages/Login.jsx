import { useEffect, useState } from 'react'
import { Sun, Moon, User, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../utils/AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [adminConfigured, setAdminConfigured] = useState(null)
  const [setupError, setSetupError] = useState('')
  const [dark, setDark] = useState(() => localStorage.getItem('crm_theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('crm_theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    fetch('/api/auth/setup-status')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not check admin setup.')
        return response.json()
      })
      .then((result) => setAdminConfigured(result.configured))
      .catch((requestError) => setSetupError(requestError.message || 'The backend API is not available.'))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sun-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="relative">
          <Logo onDark className="h-12" />
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.22em] text-blue-200">CRM Suite</p>
        </div>
        <img src="/solar-hero.svg" alt="Solar panels under the sun" className="relative mx-auto w-full max-w-md animate-float drop-shadow-2xl" />
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">Leads, attendance &amp;<br />solar service — one place.</h2>
          <p className="mt-4 max-w-md text-blue-100">Manage every lead source, assign work fairly, and keep every quarterly solar maintenance on schedule with OTP-verified visits.</p>
        </div>
        <p className="relative text-sm text-blue-200">© ZX Solar</p>
      </div>

      <div className="relative flex items-center justify-center bg-slate-50 p-6">
        <button
          type="button"
          onClick={() => setDark((value) => !value)}
          aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
          title={`Switch to ${dark ? 'light' : 'dark'} theme`}
          className="absolute right-5 top-5 rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="card w-full max-w-md animate-fadeUp !p-6 shadow-lift sm:!p-8">
          <Logo className="mb-6 h-11 lg:hidden" />
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">Sign in with your ID and password</p>
          {setupError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{setupError}</p>}
          {adminConfigured === false && <p role="alert" className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">The first admin has not been configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in the backend environment, then restart the API.</p>}
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
            <button type="submit" disabled={submitting} className="btn-primary w-full !py-2.5">{submitting ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
