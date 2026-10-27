import { useEffect, useState } from 'react'
import { Banknote, BriefcaseBusiness, Check, Download, Save, Upload } from 'lucide-react'
import Badge from '../components/Badge'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { apiRequest } from '../utils/api'
import { useAuth } from '../utils/AuthContext'
import { documentToDataUrl } from '../utils/uploads'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0)
const thisMonth = new Date().toISOString().slice(0, 7)

function EmployeeProfile({ employee, token, onSaved }) {
  const [form, setForm] = useState({
    department: employee.department || '',
    jobTitle: employee.jobTitle || '',
    joiningDate: employee.joiningDate || '',
    monthlySalary: employee.monthlySalary ?? '',
  })
  const [bank, setBank] = useState({
    accountHolder: employee.bankDetails?.accountHolder || '',
    bankName: employee.bankDetails?.bankName || '',
    accountNumber: employee.bankDetails?.accountNumber || '',
    ifsc: employee.bankDetails?.ifsc || '',
  })
  const [documentCategory, setDocumentCategory] = useState('Identity proof')
  const [documentFile, setDocumentFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const profile = await apiRequest(`/api/hr/employees/${employee.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ ...form, monthlySalary: Number(form.monthlySalary) }),
      })
      onSaved(employee.id, profile)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const saveBank = async () => {
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest(`/api/hr/employees/${employee.id}/bank-details`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(bank),
      })
      onSaved(employee.id, { bankDetails: result.bankDetails })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const uploadDocument = async () => {
    if (!documentFile) return
    setSaving(true)
    setError('')
    try {
      const document = await documentToDataUrl(documentFile)
      const uploaded = await apiRequest(`/api/hr/employees/${employee.id}/documents`, {
        method: 'POST',
        token,
        body: JSON.stringify({ category: documentCategory, document }),
      })
      onSaved(employee.id, { documents: [uploaded, ...(employee.documents || [])] })
      setDocumentFile(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const downloadDocument = async (document) => {
    setError('')
    try {
      const response = await fetch(`/api/hr/employees/${employee.id}/documents/${document.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || `Download failed (${response.status})`)
      }
      const url = URL.createObjectURL(await response.blob())
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <form onSubmit={save} className="border-t border-slate-100 p-4 first:border-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{employee.name}</p>
          <p className="text-xs text-slate-500">{employee.username} · {employee.role === 'technician' ? 'Technician' : 'Employee'}</p>
        </div>
        <Badge>{employee.active === false ? 'Inactive' : 'Active'}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-semibold text-slate-600">Department
          <input maxLength={100} className="input mt-1" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
        </label>
        <label className="text-xs font-semibold text-slate-600">Job title
          <input maxLength={100} className="input mt-1" value={form.jobTitle} onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))} />
        </label>
        <label className="text-xs font-semibold text-slate-600">Joining date
          <input type="date" className="input mt-1" value={form.joiningDate} onChange={(event) => setForm((current) => ({ ...current, joiningDate: event.target.value }))} />
        </label>
        <label className="text-xs font-semibold text-slate-600">Monthly salary (INR)
          <input required type="number" min="0" max="1000000000" step="0.01" className="input mt-1" value={form.monthlySalary} onChange={(event) => setForm((current) => ({ ...current, monthlySalary: event.target.value }))} />
        </label>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Bank account details</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-semibold text-slate-600">Account holder
            <input maxLength={120} className="input mt-1" value={bank.accountHolder} onChange={(event) => setBank((current) => ({ ...current, accountHolder: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Bank name
            <input maxLength={120} className="input mt-1" value={bank.bankName} onChange={(event) => setBank((current) => ({ ...current, bankName: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Account number
            <input inputMode="numeric" autoComplete="off" className="input mt-1" value={bank.accountNumber} onChange={(event) => setBank((current) => ({ ...current, accountNumber: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">IFSC
            <input maxLength={11} autoCapitalize="characters" className="input mt-1 uppercase" value={bank.ifsc} onChange={(event) => setBank((current) => ({ ...current, ifsc: event.target.value.toUpperCase() }))} />
          </label>
        </div>
        <button type="button" disabled={saving} onClick={saveBank} className="btn-outline mt-3"><Save size={15} /> Save bank details</button>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Private employee documents</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-slate-600">Document type
            <select className="input mt-1" value={documentCategory} onChange={(event) => setDocumentCategory(event.target.value)}>
              <option>Identity proof</option>
              <option>Bank proof</option>
            </select>
          </label>
          <label className="min-w-56 flex-1 text-xs font-semibold text-slate-600">Choose PDF, JPEG, or PNG (up to 7 MB)
            <input type="file" accept="application/pdf,image/jpeg,image/png" className="input mt-1" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
          </label>
          <button type="button" disabled={saving || !documentFile} onClick={uploadDocument} className="btn-outline"><Upload size={15} /> {saving ? 'Uploading…' : 'Upload document'}</button>
        </div>
        <ul className="mt-3 space-y-2">
          {(employee.documents || []).map((document) => <li key={document.id} className="flex items-center justify-between gap-3 text-sm">
            <span>{document.category} · {document.fileName}</span>
            <button type="button" onClick={() => downloadDocument(document)} className="inline-flex items-center gap-1 font-semibold text-brand-700"><Download size={14} /> Download</button>
          </li>)}
          {!employee.documents?.length && <li className="text-xs text-slate-500">No documents uploaded.</li>}
        </ul>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
      <button disabled={saving} className="btn-outline mt-3"><Save size={15} /> {saving ? 'Saving…' : 'Save HR profile'}</button>
    </form>
  )
}

export default function HrPanel() {
  const { token } = useAuth()
  const [employees, setEmployees] = useState([])
  const [payroll, setPayroll] = useState([])
  const [form, setForm] = useState({ employeeId: '', month: thisMonth, deductionLabel: '', deductionAmount: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      apiRequest('/api/hr/employees', { token }),
      apiRequest('/api/hr/payroll', { token }),
    ]).then(([employeeRows, payrollRows]) => {
      if (!active) return
      setEmployees(employeeRows)
      setPayroll(payrollRows)
      setForm((current) => ({
        ...current,
        employeeId: current.employeeId || employeeRows.find((employee) => employee.active !== false && employee.monthlySalary !== undefined)?.id || '',
      }))
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [token])

  const saveProfile = (id, profile) => {
    setEmployees((current) => current.map((employee) => employee.id === id ? { ...employee, ...profile } : employee))
  }

  const createPayroll = async (event) => {
    event.preventDefault()
    if (Boolean(form.deductionLabel.trim()) !== (form.deductionAmount !== '')) {
      setError('Enter both a deduction label and amount, or leave both blank.')
      return
    }
    setSaving(true)
    setError('')
    const deductions = form.deductionLabel.trim() && form.deductionAmount !== ''
      ? [{ label: form.deductionLabel, amount: Number(form.deductionAmount) }]
      : []
    try {
      const record = await apiRequest('/api/hr/payroll', {
        method: 'POST',
        token,
        body: JSON.stringify({ employeeId: form.employeeId, month: form.month, deductions }),
      })
      setPayroll((current) => [record, ...current])
      setForm((current) => ({ ...current, deductionLabel: '', deductionAmount: '' }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const markPaid = async (id) => {
    setError('')
    try {
      const updated = await apiRequest(`/api/hr/payroll/${id}/paid`, { method: 'PATCH', token })
      setPayroll((current) => current.map((record) => record.id === id ? updated : record))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const activeEmployees = employees.filter((employee) => employee.active !== false)
  const payrollEmployees = activeEmployees.filter((employee) => employee.monthlySalary !== undefined)
  const pending = payroll.filter((record) => record.status === 'Pending')

  return (
    <>
      <PageHeader eyebrow="Human resources" title="HR & payroll" subtitle="Employee records, monthly salary, attendance review, and payroll slips." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active employees" value={activeEmployees.length} icon={BriefcaseBusiness} />
        <StatCard label="Payroll records" value={payroll.length} icon={Banknote} />
        <StatCard label="Pending payments" value={pending.length} icon={Banknote} tone="amber" />
      </div>

      <section className="card mb-6 !p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="section-title">Employee management</h2>
          <p className="text-xs text-slate-500">Bank details and private documents are visible only to HR and that employee; bank data is encrypted at rest.</p>
        </div>
        {loading ? <p className="p-5 text-sm text-slate-500">Loading employees…</p>
          : employees.map((employee) => <EmployeeProfile key={employee.id} employee={employee} token={token} onSaved={saveProfile} />)}
        {!loading && !employees.length && <p className="p-5 text-sm text-slate-500">Create employee or technician accounts in Team accounts first.</p>}
      </section>

      <form onSubmit={createPayroll} className="card mb-6">
        <h2 className="section-title">Create monthly payroll</h2>
        <p className="mb-4 text-xs text-slate-500">Monthly salary is paid in full with no attendance proration. Enter statutory and other deductions manually; the system does not estimate taxes.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-semibold text-slate-600">Employee
            <select required className="input mt-1" value={form.employeeId} onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}>
              {payrollEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {money(employee.monthlySalary)}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Pay month
            <input required type="month" className="input mt-1" value={form.month} onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Deduction label (optional)
            <input maxLength={100} className="input mt-1" placeholder="PF, ESI, advance…" value={form.deductionLabel} onChange={(event) => setForm((current) => ({ ...current, deductionLabel: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Deduction amount (INR)
            <input type="number" min="0" step="0.01" className="input mt-1" value={form.deductionAmount} onChange={(event) => setForm((current) => ({ ...current, deductionAmount: event.target.value }))} />
          </label>
        </div>
        {!payrollEmployees.length && <p className="mt-3 text-xs text-amber-700">Save a monthly salary in an employee profile before creating payroll.</p>}
        <button disabled={saving || !payrollEmployees.length || !form.employeeId} className="btn-primary mt-4">{saving ? 'Creating…' : 'Create payslip'}</button>
      </form>

      <section className="card overflow-hidden !p-0">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="section-title">Payroll & payslips</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead><tr><th className="th">Employee</th><th className="th">Month</th><th className="th">Gross salary</th><th className="th">Deductions</th><th className="th">Net pay</th><th className="th">Status</th><th className="th">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {payroll.map((record) => <tr key={record.id}>
                <td className="td font-medium">{record.employeeName}</td>
                <td className="td">{record.month}</td>
                <td className="td">{money(record.grossSalary)}</td>
                <td className="td">{record.deductions.length ? record.deductions.map((item) => `${item.label}: ${money(item.amount)}`).join(', ') : '—'}</td>
                <td className="td font-semibold">{money(record.netSalary)}</td>
                <td className="td"><Badge>{record.status}</Badge></td>
                <td className="td">{record.status === 'Paid' ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Check size={14} /> Paid</span> : <button className="btn-outline !px-2 !py-1" onClick={() => markPaid(record.id)}>Mark paid</button>}</td>
              </tr>)}
              {!payroll.length && <tr><td className="px-5 py-10 text-center text-sm text-slate-400" colSpan={7}>No payroll records yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
