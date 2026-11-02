import { DOCUMENT_TYPES } from '../utils/documentTypes'
import { useEffect, useState } from 'react'
import { Download, FileText, ShieldCheck, Upload } from 'lucide-react'
import Avatar from '../components/Avatar'
import PageHeader from '../components/PageHeader'
import { apiRequest } from '../utils/api'
import { useAuth } from '../utils/AuthContext'
import { documentToDataUrl } from '../utils/uploads'

function ProfileField({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value || 'Not added'}</dd>
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'Not added'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export default function MyProfile() {
  const { token, user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [documentCategory, setDocumentCategory] = useState(DOCUMENT_TYPES[0])
  const [documentFile, setDocumentFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/api/hr/me', { token }).then((result) => {
      if (!active) return
      setProfile(result)
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [token])

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
      setProfile((current) => ({
        ...current,
        updatedAt: result.uploadedAt,
        updatedBy: { id: result.uploadedBy, name: result.uploadedByName, role: result.uploadedByRole },
        documents: [result, ...(current.documents || [])],
      }))
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
      <PageHeader eyebrow="My account" title="My profile & documents" subtitle={`${user.name} · view your HR profile and submit documents for review.`} />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {loading ? <div className="card text-sm text-slate-500">Loading your profile…</div> : <>
        <section className="card mb-6 overflow-hidden !p-0">
          <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 px-5 py-6 text-white sm:px-7">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={profile?.employee?.name || user.name} size="h-16 w-16" className="rounded-2xl text-lg ring-2 ring-white/40" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-100">Employee profile</p>
                <h2 className="mt-1 truncate text-2xl font-bold">{profile?.employee?.name || user.name}</h2>
                <p className="mt-1 text-sm text-blue-100">
                  {[profile?.jobTitle, profile?.department].filter(Boolean).join(' · ') || 'Your work and personal information'}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm">
                <span className="block text-xs text-blue-100">Employee ID</span>
                <span className="font-semibold">{profile?.employee?.reference || '—'}</span>
              </div>
            </div>
          </div>
          <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-7">
            <ProfileField label="Department" value={profile?.department} />
            <ProfileField label="Job title" value={profile?.jobTitle} />
            <ProfileField label="Joining date" value={formatDate(profile?.joiningDate)} />
            <ProfileField
              label="Monthly salary"
              value={profile?.monthlySalary == null
                ? ''
                : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(profile.monthlySalary)}
            />
            <ProfileField label="Mobile number" value={profile?.employee?.phone} />
            <ProfileField label="Email ID" value={profile?.employee?.contactEmail || profile?.employee?.email} />
            <ProfileField label="Present address" value={profile?.presentAddress} />
            <ProfileField label="Date of birth" value={formatDate(profile?.dateOfBirth)} />
          </dl>
          {profile?.updatedAt && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:px-7">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>
                Last updated {new Date(profile.updatedAt).toLocaleString()}
                {profile.updatedBy?.name ? ` by ${profile.updatedBy.name}${profile.updatedBy.role === 'hr' ? ' (HR)' : ''}` : ''}
              </span>
            </div>
          )}
        </section>

        <section className="card mb-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="section-title !mb-1">Profile details</h2>
              <p className="text-xs text-slate-500">These details are managed by HR. Contact HR if something needs correction.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">View only</span>
          </div>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileField label="Full name" value={profile?.employee?.name} />
            <ProfileField label="Mobile number" value={profile?.employee?.phone} />
            <ProfileField label="Email address" value={profile?.employee?.contactEmail || profile?.employee?.email} />
            <ProfileField label="Temporary address" value={profile?.temporaryAddress} />
            <ProfileField label="Father name" value={profile?.fatherName} />
            <ProfileField label="Mother name" value={profile?.motherName} />
          </dl>
          {profile?.bankDetails && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Bank details · view only</h3>
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <ProfileField label="Account holder" value={profile.bankDetails.accountHolder} />
                <ProfileField label="Bank name" value={profile.bankDetails.bankName} />
                <ProfileField label="Account number" value={profile.bankDetails.accountNumber ? `••••${profile.bankDetails.accountNumber.slice(-4)}` : ''} />
                <ProfileField label="IFSC" value={profile.bankDetails.ifsc} />
              </dl>
            </div>
          )}
        </section>

        <form onSubmit={uploadDocument} className="card mb-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={17} className="text-brand-600" />
            <h2 className="section-title !mb-0">Upload employee document</h2>
          </div>
          <p className="mb-4 text-xs text-slate-500">Submitting uploads this private document directly to HR for review. Accepted: PDF, JPEG, or PNG up to 7 MB.</p>
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
          <button disabled={uploading || !documentFile} className="btn-primary mt-4"><Upload size={16} /> {uploading ? 'Submitting…' : 'Submit document to HR'}</button>
        </form>

        <section className="card">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title !mb-1">My documents</h2>
              <p className="text-xs text-slate-500">Documents added by you or HR are listed here.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{profile?.documents?.length || 0}</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {(profile?.documents || []).map((document) => <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="rounded-lg bg-brand-50 p-2 text-brand-700"><FileText size={17} /></span>
                <span className="min-w-0">
                  <b className="block text-sm text-slate-800">{document.category}</b>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{document.fileName}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {formatDate(document.uploadedAt)}
                    {document.uploadedByName ? ` · Added by ${document.uploadedByName}${document.uploadedByRole === 'hr' ? ' (HR)' : ''}` : ''}
                  </span>
                  {document.reviewStatus === 'Pending review' && (
                    <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Submitted · Pending HR review</span>
                  )}
                </span>
              </div>
              <button type="button" onClick={() => downloadDocument(document)} className="btn-outline !px-3 !py-1.5 text-xs"><Download size={14} /> Download</button>
            </li>)}
            {!profile?.documents?.length && <li className="py-6 text-center text-sm text-slate-500">No documents uploaded yet.</li>}
          </ul>
        </section>
      </>}
    </>
  )
}
