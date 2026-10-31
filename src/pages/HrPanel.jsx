import { DOCUMENT_TYPES } from '../utils/documentTypes'
import { useEffect, useState } from 'react'
import { Banknote, BriefcaseBusiness, CalendarDays, Check, ChevronRight, Download, Save, Search, Upload, UserRound, UsersRound } from 'lucide-react'
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
  const [account, setAccount] = useState({
    name: employee.name || '',
    phone: employee.phone || '',
    contactEmail: employee.contactEmail || employee.employee?.email || '',
  })
  const [bank, setBank] = useState({
    accountHolder: employee.bankDetails?.accountHolder || '',
    bankName: employee.bankDetails?.bankName || '',
    accountNumber: employee.bankDetails?.accountNumber || '',
    ifsc: employee.bankDetails?.ifsc || '',
  })
  const [documentCategory, setDocumentCategory] = useState(DOCUMENT_TYPES[0])
  const [documentFile, setDocumentFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reviewingContact, setReviewingContact] = useState(false)

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

  const [personal, setPersonal] = useState({
    presentAddress: employee.presentAddress || '',
    temporaryAddress: employee.temporaryAddress || '',
    motherName: employee.motherName || '',
    fatherName: employee.fatherName || '',
    dateOfBirth: employee.dateOfBirth || '',
  })

  const savePersonal = async () => {
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest(`/api/hr/employees/${employee.id}/personal-details`, {
        method: 'PATCH', token, body: JSON.stringify(personal),
      })
      onSaved(employee.id, result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const saveAccount = async () => {
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest(`/api/hr/employees/${employee.id}/account`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(account),
      })
      onSaved(employee.id, result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const reviewContact = async (decision) => {
    setReviewingContact(true)
    setError('')
    try {
      const result = await apiRequest(`/api/hr/employees/${employee.id}/contact-details/review`, {
        method: 'POST',
        token,
        body: JSON.stringify({ decision }),
      })
      onSaved(employee.id, result)
      setAccount({
        name: result.employee.name || '',
        phone: result.employee.phone || '',
        contactEmail: result.employee.contactEmail || result.employee.email || '',
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setReviewingContact(false)
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
          <p className="text-xs text-slate-500">ID {employee.employee?.reference} · Mobile {employee.phone || '—'} · Email {employee.employee?.email || '—'}</p>
        </div>
        <Badge>{employee.active === false ? 'Inactive' : 'Active'}</Badge>
      </div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Employee account details</h3>
        <p className="mb-3 text-xs text-slate-500">HR updates sync to the employee’s My Profile. Contact email does not change the login ID.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600">Name
            <input required maxLength={100} className="input mt-1" value={account.name} onChange={(event) => setAccount((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Mobile number
            <input maxLength={50} className="input mt-1" value={account.phone} onChange={(event) => setAccount((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Contact email
            <input type="email" maxLength={254} className="input mt-1" value={account.contactEmail} onChange={(event) => setAccount((current) => ({ ...current, contactEmail: event.target.value }))} />
          </label>
        </div>
        <button type="button" disabled={saving} onClick={saveAccount} className="btn-outline mt-3"><Save size={15} /> {saving ? 'Saving…' : 'Save account details'}</button>
      </div>
      {employee.pendingContactChange && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-bold text-amber-900">Pending employee contact update</h3>
          <p className="mt-1 text-xs text-amber-800">{employee.pendingContactChange.name} · {employee.pendingContactChange.phone || 'No phone'} · {employee.pendingContactChange.contactEmail || 'No email'}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={reviewingContact} onClick={() => reviewContact('Approved')} className="btn-primary !py-2"><Check size={15} /> Approve</button>
            <button type="button" disabled={reviewingContact} onClick={() => reviewContact('Rejected')} className="btn-outline !py-2">{reviewingContact ? 'Saving…' : 'Reject'}</button>
          </div>
        </div>
      )}
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
        <h3 className="mb-3 text-sm font-bold text-slate-800">Personal details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Present address
            <input maxLength={300} className="input mt-1" value={personal.presentAddress} onChange={(event) => setPersonal((current) => ({ ...current, presentAddress: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Temporary address
            <input maxLength={300} className="input mt-1" value={personal.temporaryAddress} onChange={(event) => setPersonal((current) => ({ ...current, temporaryAddress: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Father name
            <input maxLength={300} className="input mt-1" value={personal.fatherName} onChange={(event) => setPersonal((current) => ({ ...current, fatherName: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Mother name
            <input maxLength={300} className="input mt-1" value={personal.motherName} onChange={(event) => setPersonal((current) => ({ ...current, motherName: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Date of birth
            <input type="date" maxLength={300} className="input mt-1" value={personal.dateOfBirth} onChange={(event) => setPersonal((current) => ({ ...current, dateOfBirth: event.target.value }))} />
          </label>
        </div>
        <button type="button" disabled={saving} onClick={savePersonal} className="btn-primary mt-3">Save personal details</button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Private employee documents</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-slate-600">Document type
            <select className="input mt-1" value={documentCategory} onChange={(event) => setDocumentCategory(event.target.value)}>
              {DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
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
  const [payrollEmployeeFilter, setPayrollEmployeeFilter] = useState('')
  const [payrollMonthFilter, setPayrollMonthFilter] = useState('')
  const [payrollPreview, setPayrollPreview] = useState(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
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
      setSelectedEmployeeId((current) => current || employeeRows.find((employee) => employee.active !== false)?.id || '')
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (!form.employeeId || !form.month) return undefined
    let active = true
    apiRequest(`/api/hr/payroll/preview?employeeId=${encodeURIComponent(form.employeeId)}&month=${encodeURIComponent(form.month)}`, { token })
      .then((result) => { if (active) setPayrollPreview(result) })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [form.employeeId, form.month, token])

  const saveProfile = (id, profile) => {
    setEmployees((current) => current.map((employee) => employee.id === id
      ? { ...employee, ...profile, employee: profile.employee ? { ...employee.employee, ...profile.employee } : employee.employee }
      : employee))
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

  const syncPayroll = async (id) => {
    setError('')
    try {
      const updated = await apiRequest(`/api/hr/payroll/${id}/sync`, { method: 'PATCH', token })
      setPayroll((current) => current.map((record) => record.id === id ? updated : record))
    } catch (requestError) {
      setError(requestError.message)
    }

  }

  const downloadPayrollSlip = async (record) => {
    setError('')
    try {
      const response = await fetch(`/api/hr/payroll/${record.id}/slip`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || `Download failed (${response.status})`)
      }
      const url = URL.createObjectURL(await response.blob())
      const link = window.document.createElement('a')
      link.href = url
      link.download = `salary-slip-${record.month}-${record.employeeName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.html`
      link.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const activeEmployees = employees.filter((employee) => employee.active !== false)
  const payrollEmployees = activeEmployees.filter((employee) => employee.monthlySalary !== undefined)
  const pending = payroll.filter((record) => record.status === 'Pending')
  const visiblePayroll = payroll.filter((record) =>
    (!payrollEmployeeFilter || record.employeeId === payrollEmployeeFilter) &&
    (!payrollMonthFilter || record.month === payrollMonthFilter))
  const payrollByEmployee = payrollEmployees.map((employee) => {
    const records = payroll.filter((record) => record.employeeId === employee.id)
    return { employee, records, current: records.find((record) => record.month === thisMonth) }
  })

  return (
    <>
      <PageHeader eyebrow="Human resources" title="HR & payroll" subtitle="Manage every employee profile, salary, deductions, payslip and payment status from one clean workspace." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active employees" value={activeEmployees.length} icon={BriefcaseBusiness} />
        <StatCard label="Payroll records" value={payroll.length} icon={Banknote} />
        <StatCard label="Pending payments" value={pending.length} icon={Banknote} tone="amber" />
      </div>

      <section className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="section-title">Employee payroll overview</h2>
            <p className="text-xs text-slate-500">Each employee has an independent monthly payroll record and payment status.</p>
          </div>
          <UsersRound size={20} className="text-brand-600" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {payrollByEmployee.map(({ employee, records, current }) => (
            <button type="button" key={employee.id} onClick={() => setPayrollEmployeeFilter(employee.id)} className={`card !p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lift ${payrollEmployeeFilter === employee.id ? 'ring-2 ring-brand-300' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><UserRound size={18} /></span>
                <Badge>{current?.status || 'Not created'}</Badge>
              </div>
              <p className="mt-3 font-bold text-slate-900">{employee.name}</p>
              <p className="text-xs text-slate-500">{employee.jobTitle || employee.role} · {employee.username}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div><p className="text-[11px] uppercase tracking-wide text-slate-400">Monthly salary</p><p className="font-semibold text-slate-800">{money(employee.monthlySalary)}</p></div>
                <div><p className="text-[11px] uppercase tracking-wide text-slate-400">Records</p><p className="font-semibold text-slate-800">{records.length}</p></div>
              </div>
            </button>
          ))}
        </div>
        {!payrollByEmployee.length && <div className="card py-8 text-center text-sm text-slate-500">Save salary details for an employee to start payroll management.</div>}
      </section>

      <section className="card mb-6 !p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="section-title">Employee management</h2>
          <p className="text-xs text-slate-500">Select an active employee to manage their profile, salary, bank details and private documents. Bank data is encrypted at rest.</p>
        </div>
        {loading ? <p className="p-5 text-sm text-slate-500">Loading employees…</p> : (
          <>
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {activeEmployees.map((employee) => (
                <button
                  type="button"
                  key={employee.id}
                  onClick={() => setSelectedEmployeeId(employee.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${selectedEmployeeId === employee.id ? 'border-brand-300 bg-brand-50/60 ring-2 ring-brand-100' : 'border-slate-200 bg-white'}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">{employee.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">{employee.name}</span>
                    <span className="block truncate text-xs text-slate-500">{employee.jobTitle || employee.role} · {employee.username}</span>
                    <span className="mt-1 block text-xs font-semibold text-brand-700">{employee.monthlySalary !== undefined ? money(employee.monthlySalary) : 'Salary not set'}</span>
                  </span>
                  <ChevronRight size={17} className={selectedEmployeeId === employee.id ? 'text-brand-600' : 'text-slate-300'} />
                </button>
              ))}
            </div>
            {!activeEmployees.length && <p className="p-5 text-sm text-slate-500">Create employee or technician accounts in Team accounts first.</p>}
            {selectedEmployeeId && employees.find((employee) => employee.id === selectedEmployeeId) && (
              <div className="border-t border-slate-100 bg-slate-50/40">
                <EmployeeProfile
                  key={selectedEmployeeId}
                  employee={employees.find((employee) => employee.id === selectedEmployeeId)}
                  token={token}
                  onSaved={saveProfile}
                />
              </div>
            )}
          </>
        )}
      </section>

      <form onSubmit={createPayroll} className="card mb-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><h2 className="section-title">Create monthly payroll</h2><p className="text-xs text-slate-500">Create one separate payslip per employee and pay month.</p></div>
          <CalendarDays size={20} className="text-brand-600" />
        </div>
        <p className="mb-4 text-xs text-slate-500">Payable salary is calculated from attendance for the selected month. Present/on-field is a full day, half-day is 0.5 day, and missing weekdays are unpaid. Add manual deductions after the preview.</p>
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
        {payrollPreview && (
          <div className="mt-4 grid gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div><p className="text-[11px] uppercase tracking-wide text-brand-700">Scheduled days</p><p className="text-lg font-bold text-slate-900">{payrollPreview.scheduledDays}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-brand-700">Present / half</p><p className="text-lg font-bold text-slate-900">{payrollPreview.presentDays} / {payrollPreview.halfDays}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-brand-700">Payable days</p><p className="text-lg font-bold text-slate-900">{payrollPreview.payableDays}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-brand-700">Attendance salary</p><p className="text-lg font-bold text-slate-900">{money(payrollPreview.attendanceSalary)}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-brand-700">After current deduction</p><p className="text-lg font-bold text-slate-900">{money(Math.max(0, payrollPreview.attendanceSalary - (Number(form.deductionAmount) || 0)))}</p></div>
          </div>
        )}
        {!payrollEmployees.length && <p className="mt-3 text-xs text-amber-700">Save a monthly salary in an employee profile before creating payroll.</p>}
        <button disabled={saving || !payrollEmployees.length || !form.employeeId} className="btn-primary mt-4">{saving ? 'Creating…' : 'Create payslip'}</button>
      </form>

      <section className="card overflow-hidden !p-0">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div><h2 className="section-title">Payroll & payslips</h2><p className="text-xs text-slate-500">Review, filter and mark each employee’s monthly payroll as paid.</p></div>
          <div className="flex flex-wrap gap-2">
            <label className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select aria-label="Filter payroll by employee" className="input !w-52 !pl-8 !py-2 text-xs" value={payrollEmployeeFilter} onChange={(event) => setPayrollEmployeeFilter(event.target.value)}><option value="">All employees</option>{payrollEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
            <input aria-label="Filter payroll by month" type="month" className="input !w-36 !py-2 text-xs" value={payrollMonthFilter} onChange={(event) => setPayrollMonthFilter(event.target.value)} />
            {(payrollEmployeeFilter || payrollMonthFilter) && <button type="button" className="btn-outline !py-2 text-xs" onClick={() => { setPayrollEmployeeFilter(''); setPayrollMonthFilter('') }}>Clear</button>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead><tr><th className="th">Employee</th><th className="th">Month</th><th className="th">Gross salary</th><th className="th">Deductions</th><th className="th">Net pay</th><th className="th">Status</th><th className="th">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visiblePayroll.map((record) => <tr key={record.id}>
                <td className="td font-medium">{record.employeeName}</td>
                <td className="td">{record.month}</td>
                <td className="td">{money(record.grossSalary)}</td>
                <td className="td">{record.deductions.length ? record.deductions.map((item) => `${item.label}: ${money(item.amount)}`).join(', ') : '—'}</td>
                <td className="td font-semibold">{money(record.netSalary)}</td>
                <td className="td"><Badge>{record.status}</Badge></td>
                <td className="td"><div className="flex flex-wrap gap-2">{record.status === 'Paid' ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Check size={14} /> Paid</span> : <><button className="btn-outline !px-2 !py-1 text-xs" onClick={() => syncPayroll(record.id)}>Recalculate</button><button className="btn-outline !px-2 !py-1 text-xs" onClick={() => markPaid(record.id)}>Mark paid</button></>}<button className="btn-outline !px-2 !py-1 text-xs" onClick={() => downloadPayrollSlip(record)}><Download size={14} /> Slip</button></div></td>
              </tr>)}
              {!visiblePayroll.length && <tr><td className="px-5 py-10 text-center text-sm text-slate-400" colSpan={7}>{payroll.length ? 'No payroll matches the selected filters.' : 'No payroll records yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
