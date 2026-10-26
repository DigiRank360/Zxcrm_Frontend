import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useCrm } from '../utils/CrmContext'
import Badge from '../components/Badge'

const blank = { name: '', username: '', password: '', phone: '', role: 'employee' }

export default function Team() {
  const { users, addUser } = useCrm()
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const user = await addUser(form)
      setCreated({ ...user, password: form.password })
      setForm(blank)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Admin" title="Team accounts" subtitle="Create login IDs (including email-style IDs) and passwords for employees and technicians." />
      <form onSubmit={submit} className="card mb-6">
        <h2 className="section-title flex items-center gap-2"><UserPlus size={18} /> Create account</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600">Full name
            <input required className="input mt-1" value={form.name} onChange={set('name')} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Login ID
            <input required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]{3,40}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+" title="Use a 3–40 character login ID. Email-style IDs are supported." autoComplete="off" className="input mt-1" value={form.username} onChange={set('username')} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Temporary password (12+ characters)
            <input required type="password" minLength={12} autoComplete="new-password" className="input mt-1" value={form.password} onChange={set('password')} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Phone number
            <input type="tel" className="input mt-1" value={form.phone} onChange={set('phone')} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Account role
            <select className="input mt-1" value={form.role} onChange={set('role')}>
              <option value="employee">Employee / lead agent</option>
              <option value="technician">Technician</option>
            </select>
          </label>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {created && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Account created for <b>{created.name}</b>. Share these credentials securely: ID <b>{created.username}</b>, temporary password <b>{created.password}</b>.
          <button type="button" className="ml-2 underline" onClick={() => setCreated(null)}>Hide</button>
        </div>}
        <button disabled={saving} className="btn-primary mt-4"><UserPlus size={16} /> {saving ? 'Creating…' : 'Create account'}</button>
      </form>

      <div className="card">
        <h2 className="section-title">Current accounts</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead><tr><th className="th">Name</th><th className="th">Login ID</th><th className="th">Phone</th><th className="th">Role</th><th className="th">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => <tr key={user.id}>
                <td className="td font-medium">{user.name}</td>
                <td className="td">{user.username}</td>
                <td className="td">{user.phone || '—'}</td>
                <td className="td">{user.role === 'employee' ? 'Employee' : user.role === 'technician' ? 'Technician' : 'Admin'}</td>
                <td className="td"><Badge>{user.active === false ? 'Inactive' : 'Active'}</Badge></td>
              </tr>)}
              {!users.length && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">No accounts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
