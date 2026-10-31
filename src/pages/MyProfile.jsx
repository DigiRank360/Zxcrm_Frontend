import { DOCUMENT_TYPES } from '../utils/documentTypes'
import { useEffect, useState } from 'react'
import { Download, Save, Upload } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { apiRequest } from '../utils/api'
import { useAuth } from '../utils/AuthContext'
import { documentToDataUrl } from '../utils/uploads'

export default function MyProfile() {
  const { token, user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [bank, setBank] = useState({ accountHolder: '', bankName: '', accountNumber: '', ifsc: '' })
  const [documentCategory, setDocumentCategory] = useState(DOCUMENT_TYPES[0])
  const [documentFile, setDocumentFile] = useState(null)
  const [personal, setPersonal] = useState({ presentAddress: '', temporaryAddress: '', fatherName: '', motherName: '', dateOfBirth: '' })
  const [contact, setContact] = useState({ name: '', phone: '', contactEmail: '' })
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingBank, setSavingBank] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/api/hr/me', { token }).then((result) => {
      if (!active) return
      setProfile(result)
      setContact({
        name: result.employee?.name || '',
        phone: result.employee?.phone || '',
        contactEmail: result.employee?.contactEmail || '',
      })
      setPersonal({
        presentAddress: result.presentAddress || '',
        temporaryAddress: result.temporaryAddress || '',
        fatherName: result.fatherName || '',
        motherName: result.motherName || '',
        dateOfBirth: result.dateOfBirth || '',
      })
      setBank(result.bankDetails || { accountHolder: '', bankName: '', accountNumber: '', ifsc: '' })
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [token])

  const requestContactUpdate = async (event) => {
    event.preventDefault()
    setSavingContact(true)
    setError('')
    try {
      const result = await apiRequest('/api/hr/me/contact-details', {
        method: 'PATCH',
        token,
        body: JSON.stringify(contact),
      })
      setProfile((current) => ({ ...current, pendingContactChange: result.pendingContactChange }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingContact(false)
    }
  }

  const savePersonal = async (event) => {
    event.preventDefault()
    setSavingPersonal(true)
    setError('')
    try {
      const result = await apiRequest('/api/hr/me/personal-details', {
        method: 'PATCH', token, body: JSON.stringify(personal),
      })
      setPersonal(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingPersonal(false)
    }
  }

  const saveBank = async (event) => {
    event.preventDefault()
    setSavingBank(true)
    setError('')
    try {
      const result = await apiRequest('/api/hr/me/bank-details', {
        method: 'PATCH',
        token,
        body: JSON.stringify(bank),
      })
      setBank(result.bankDetails)
      setProfile((current) => ({ ...current, bankDetails: result.bankDetails }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingBank(false)
    }
  }

  const uploadDocument = async (event) => {
    event.preventDefault()
    if (!documentFile) return
    setUploading(true)
    setError('')
    try {
      const document = await documentToDataUrl(documentFile)
      const result = await apiRequest('/api/hr/me/documents', {
        method: 'POST',
        token,
        body: JSON.stringify({ category: documentCategory, document }),
      })
      setProfile((current) => ({ ...current, documents: [result, ...(current.documents || [])] }))
      setDocumentFile(null)
      event.target.reset()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUploading(false)
    }
  }

  const downloadDocument = async (document) => {
    setError('')
    try {
      const response = await fetch(`/api/hr/me/documents/${document.id}/download`, {
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
    <>
      <PageHeader eyebrow="My account" title="My profile & documents" subtitle={`${user.name} · update bank details and upload private employee documents.`} />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {loading ? <div className="card text-sm text-slate-500">Loading your profile…</div> : <>
        <section className="card mb-6">
          <h2 className="section-title">Employee details</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs font-semibold text-slate-500">Employee ID</dt><dd className="font-semibold">{profile?.employee?.reference || '—'}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Name</dt><dd className="font-semibold">{profile?.employee?.name}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Mobile number</dt><dd className="font-semibold">{profile?.employee?.phone || '—'}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Email ID</dt><dd className="font-semibold">{profile?.employee?.email || '—'}</dd></div>
          </dl>
        </section>

        <form onSubmit={requestContactUpdate} className="card mb-6">
          <h2 className="section-title">Request contact detail update</h2>
          <p className="mb-4 text-sm text-slate-500">HR will review these changes. Leave contact email blank if you only want to update your name or phone. Your login ID will not change.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Name
              <input required maxLength={100} className="input mt-1" value={contact.name} onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Mobile number
              <input type="tel" maxLength={50} className="input mt-1" value={contact.phone} onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Contact email
              <input type="email" maxLength={254} className="input mt-1" value={contact.contactEmail} onChange={(event) => setContact((current) => ({ ...current, contactEmail: event.target.value }))} />
            </label>
          </div>
          {profile?.pendingContactChange && (
            <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Contact update pending HR review: {profile.pendingContactChange.name}
            </p>
          )}
          {profile?.lastContactChangeReview && (
            <p className="mt-2 text-xs text-slate-500">
              Last request was {profile.lastContactChangeReview.decision.toLowerCase()} by HR.
            </p>
          )}
          <button disabled={savingContact} className="btn-primary mt-4"><Save size={16} /> {savingContact ? 'Submitting…' : 'Submit for HR approval'}</button>
        </form>

        <form onSubmit={savePersonal} className="card mb-6">
          <h2 className="section-title">Personal details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <button disabled={savingPersonal} className="btn-primary mt-4"><Save size={16} /> {savingPersonal ? 'Saving…' : 'Save personal details'}</button>
        </form>

        <form onSubmit={saveBank} className="card mb-6">
          <h2 className="section-title">Bank account details</h2>
          <p className="mb-4 text-xs text-slate-500">Only you and HR can access these details. The account number is encrypted in storage. Never enter a PIN, CVV, OTP, or password.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Account holder
              <input required maxLength={120} className="input mt-1" value={bank.accountHolder} onChange={(event) => setBank((current) => ({ ...current, accountHolder: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Bank name
              <input required maxLength={120} className="input mt-1" value={bank.bankName} onChange={(event) => setBank((current) => ({ ...current, bankName: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Account number
              <input required inputMode="numeric" autoComplete="off" className="input mt-1" value={bank.accountNumber} onChange={(event) => setBank((current) => ({ ...current, accountNumber: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">IFSC
              <input required maxLength={11} autoCapitalize="characters" className="input mt-1 uppercase" value={bank.ifsc} onChange={(event) => setBank((current) => ({ ...current, ifsc: event.target.value.toUpperCase() }))} />
            </label>
          </div>
          <button disabled={savingBank} className="btn-primary mt-4"><Save size={16} /> {savingBank ? 'Saving…' : 'Save bank details'}</button>
        </form>

        <form onSubmit={uploadDocument} className="card mb-6">
          <h2 className="section-title">Upload employee document</h2>
          <p className="mb-4 text-xs text-slate-500">Documents are private in Cloudinary and downloadable only by you or HR. Accepted: PDF, JPEG, or PNG up to 7 MB.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Document type
              <select className="input mt-1" value={documentCategory} onChange={(event) => setDocumentCategory(event.target.value)}>
                {DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Choose a document
              <input required type="file" accept="application/pdf,image/jpeg,image/png" className="input mt-1" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
            </label>
          </div>
          <button disabled={uploading || !documentFile} className="btn-primary mt-4"><Upload size={16} /> {uploading ? 'Uploading…' : 'Upload document'}</button>
        </form>

        <section className="card">
          <h2 className="section-title">My documents</h2>
          <ul className="divide-y divide-slate-100">
            {(profile?.documents || []).map((document) => <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span><b>{document.category}</b> · {document.fileName} · {new Date(document.uploadedAt).toLocaleDateString()}</span>
              <button type="button" onClick={() => downloadDocument(document)} className="inline-flex items-center gap-1 font-semibold text-brand-700"><Download size={15} /> Download</button>
            </li>)}
            {!profile?.documents?.length && <li className="py-4 text-sm text-slate-500">No documents uploaded yet.</li>}
          </ul>
        </section>
      </>}
    </>
  )
}
