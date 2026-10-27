import { useState } from 'react'
import { Pencil, RotateCcw, Save, Trash2, UserPlus, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useCrm } from '../utils/CrmContext'
import Badge from '../components/Badge'

const blank = { name: '', username: '', password: '', phone: '', role: 'employee', maxOpenLeads: '', serviceAreas: '', propertyTypes: '', minLeadScore: '', maxLeadScore: '' }

export default function Team() {
  const { users, addUser, updateAgentRouting, updateUserProfile, softDeleteUser, restoreUser } = useCrm()
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editError, setEditError] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const user = await addUser({
        ...form,
        ...(form.maxOpenLeads ? { maxOpenLeads: Number(form.maxOpenLeads) } : { maxOpenLeads: undefined }),
        ...(form.minLeadScore ? { minLeadScore: Number(form.minLeadScore) } : { minLeadScore: undefined }),
        ...(form.maxLeadScore ? { maxLeadScore: Number(form.maxLeadScore) } : { maxLeadScore: undefined }),
        serviceAreas: form.serviceAreas.split(',').map((value) => value.trim()).filter(Boolean),
        propertyTypes: form.propertyTypes.split(',').map((value) => value.trim()).filter(Boolean),
      })
      setCreated({ ...user, password: form.password })
      setForm(blank)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (user) => {
    setEditing(user)
    setEditForm({
      name: user.name,
      username: user.username,
      phone: user.phone || '',
      password: '',
      maxOpenLeads: user.maxOpenLeads ?? '',
      serviceAreas: (user.serviceAreas || []).join(', '),
      propertyTypes: (user.propertyTypes || []).join(', '),
      minLeadScore: user.minLeadScore ?? '',
      maxLeadScore: user.maxLeadScore ?? '',
    })
    setEditError('')
  }

  const editSet = (key) => (event) => setEditForm((current) => ({ ...current, [key]: event.target.value }))

  const saveEdit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setEditError('')
    try {
      await updateUserProfile(editing.id, {
        name: editForm.name,
        username: editForm.username,
        phone: editForm.phone,
        ...(editForm.password ? { password: editForm.password } : {}),
        ...(editing.role === 'employee' ? {
          maxOpenLeads: editForm.maxOpenLeads === '' ? null : Number(editForm.maxOpenLeads),
          serviceAreas: editForm.serviceAreas.split(',').map((value) => value.trim()).filter(Boolean),
          propertyTypes: editForm.propertyTypes.split(',').map((value) => value.trim()).filter(Boolean),
          minLeadScore: editForm.minLeadScore === '' ? null : Number(editForm.minLeadScore),
          maxLeadScore: editForm.maxLeadScore === '' ? null : Number(editForm.maxLeadScore),
        } : {}),
      })
      setEditing(null)
      setEditForm(null)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async (user) => {
    if (!window.confirm(`Soft-delete ${user.name}'s account? Their account data will be retained and they can no longer sign in.`)) return
    setError('')
    try {
      await softDeleteUser(user.id)
    } catch (err) {
      setError(err.message)
    }
  }

  const restoreAccount = async (user) => {
    setError('')
    try {
      await restoreUser(user.id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Admin" title="Team accounts" subtitle="Create login IDs (including email-style IDs) and passwords for employees and technicians." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
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
              <option value="hr">HR manager</option>
            </select>
          </label>
          {form.role === 'employee' && <>
            <label className="text-xs font-semibold text-slate-600">Open lead capacity (blank = unlimited)
              <input type="number" min="0" max="10000" className="input mt-1" value={form.maxOpenLeads} onChange={set('maxOpenLeads')} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Service areas (state/city, comma-separated)
              <input className="input mt-1" placeholder="Maharashtra, Pune" value={form.serviceAreas} onChange={set('serviceAreas')} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Property types (comma-separated)
              <input className="input mt-1" placeholder="Residential, Commercial" value={form.propertyTypes} onChange={set('propertyTypes')} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Minimum lead score
              <input type="number" min="0" max="100" className="input mt-1" value={form.minLeadScore} onChange={set('minLeadScore')} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Maximum lead score
              <input type="number" min="0" max="100" className="input mt-1" value={form.maxLeadScore} onChange={set('maxLeadScore')} />
            </label>
          </>}
        </div>
        {created && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Account created for <b>{created.name}</b>. Share these credentials securely: ID <b>{created.username}</b>, temporary password <b>{created.password}</b>.
          <button type="button" className="ml-2 underline" onClick={() => setCreated(null)}>Hide</button>
        </div>}
        <button disabled={saving} className="btn-primary mt-4"><UserPlus size={16} /> {saving ? 'Creating…' : 'Create account'}</button>
      </form>

      <div className="card">
        <h2 className="section-title">Current accounts</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead><tr><th className="th">Name</th><th className="th">Login ID</th><th className="th">Phone</th><th className="th">Role</th><th className="th">Status</th><th className="th">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => <tr key={user.id}>
                <td className="td font-medium">{user.name}</td>
                <td className="td">{user.username}</td>
                <td className="td">{user.phone || '—'}</td>
                <td className="td">{user.role === 'employee' ? 'Employee' : user.role === 'technician' ? 'Technician' : user.role === 'hr' ? 'HR' : 'Admin'}</td>
                <td className="td">
                  {user.deletedAt ? <Badge>Soft deleted</Badge> : <button type="button" disabled={user.role !== 'employee'} onClick={async () => {
                    try { await updateAgentRouting(user.id, { active: user.active === false, maxOpenLeads: user.maxOpenLeads, serviceAreas: user.serviceAreas || [], propertyTypes: user.propertyTypes || [], minLeadScore: user.minLeadScore, maxLeadScore: user.maxLeadScore }) } catch (err) { setError(err.message) }
                  }} title={user.role === 'employee' ? 'Toggle employee routing availability' : 'Availability is not configured here'}>
                    <Badge>{user.active === false ? 'Inactive · click to activate' : 'Active · click to deactivate'}</Badge>
                  </button>}
                  {user.role === 'employee' && !user.deletedAt && <p className="mt-1 text-xs text-slate-400">Capacity: {user.maxOpenLeads ?? 'unlimited'}</p>}
                </td>
                <td className="td">
                  {user.role === 'admin' ? <span className="text-xs text-slate-400">Protected admin</span> : user.deletedAt ? (
                    <button type="button" onClick={() => restoreAccount(user)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">
                      <RotateCcw size={14} /> Restore
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => startEditing(user)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50">
                        <Pencil size={14} /> Edit
                      </button>
                      <button type="button" onClick={() => deleteAccount(user)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">
                        <Trash2 size={14} /> Soft delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>)}
              {!users.length && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">No accounts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {editing && editForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
        <form role="dialog" aria-modal="true" aria-labelledby="edit-account-title" onSubmit={saveEdit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="edit-account-title" className="text-lg font-bold text-slate-900">Edit account · {editing.name}</h2>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close edit account" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Full name
              <input required maxLength={100} className="input mt-1" value={editForm.name} onChange={editSet('name')} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Login ID
              <input required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]{3,40}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+" title="Use a 3–40 character login ID. Email-style IDs are supported." autoComplete="off" className="input mt-1" value={editForm.username} onChange={editSet('username')} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Phone number
              <input type="tel" maxLength={50} className="input mt-1" value={editForm.phone} onChange={editSet('phone')} />
            </label>
            <label className="text-xs font-semibold text-slate-600">New password (optional; 12+ characters)
              <input type="password" minLength={12} autoComplete="new-password" className="input mt-1" value={editForm.password} onChange={editSet('password')} />
            </label>
            {editing.role === 'employee' && <>
              <label className="text-xs font-semibold text-slate-600">Open lead capacity (blank = unlimited)
                <input type="number" min="0" max="10000" className="input mt-1" value={editForm.maxOpenLeads} onChange={editSet('maxOpenLeads')} />
              </label>
              <label className="text-xs font-semibold text-slate-600">Service areas (comma-separated)
                <input className="input mt-1" value={editForm.serviceAreas} onChange={editSet('serviceAreas')} />
              </label>
              <label className="text-xs font-semibold text-slate-600">Property types (comma-separated)
                <input className="input mt-1" value={editForm.propertyTypes} onChange={editSet('propertyTypes')} />
              </label>
              <label className="text-xs font-semibold text-slate-600">Minimum lead score
                <input type="number" min="0" max="100" className="input mt-1" value={editForm.minLeadScore} onChange={editSet('minLeadScore')} />
              </label>
              <label className="text-xs font-semibold text-slate-600">Maximum lead score
                <input type="number" min="0" max="100" className="input mt-1" value={editForm.maxLeadScore} onChange={editSet('maxLeadScore')} />
              </label>
            </>}
          </div>
          {editError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{editError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="btn-outline"><X size={15} /> Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary"><Save size={15} /> {saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </div>}
    </>
  )
}
