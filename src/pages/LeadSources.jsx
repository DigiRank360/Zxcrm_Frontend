import { useEffect, useState } from 'react'
import { Copy, Globe, MessageCircle, Share2 } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { SiMeta } from 'react-icons/si'
import { Link } from 'react-router-dom'
import { useCrm } from '../utils/CrmContext'
import { useAuth } from '../utils/AuthContext'
import { apiRequest } from '../utils/api'
import PageHeader from '../components/PageHeader'

const sources = [
  { title: 'Facebook & Instagram Ads', leadSource: 'Meta Lead Ads', icon: SiMeta, integration: 'metaLeadAds', endpoint: '/api/webhooks/meta', description: 'Meta Lead Ads webhook subscribes to leadgen events and fetches lead details using your Meta access token.' },
  { title: 'WhatsApp', leadSource: 'WhatsApp', icon: FaWhatsapp, integration: 'whatsapp', endpoint: '/api/webhooks/whatsapp', description: 'WhatsApp Cloud API messages are verified and captured as leads in the central pool.' },
  { title: 'Website contact form', leadSource: 'Website', icon: Globe, integration: 'website', endpoint: '/api/webhooks/leads/website', description: 'Post contact form submissions from your website backend using the configured API key.' },
  { title: 'Referral form', leadSource: 'Referral', icon: Share2, integration: 'referral', endpoint: '/api/webhooks/leads/referral', description: 'Connect referral forms using the referral webhook and its server-side API key.' },
  { title: 'Other lead form/API', leadSource: 'API', icon: MessageCircle, integration: 'generic', endpoint: '/api/webhooks/leads/generic', description: 'Use the generic webhook for additional ads, partners, or referral channels.' },
]

export default function LeadSources() {
  const { leads, users } = useCrm()
  const { token } = useAuth()
  const [integrations, setIntegrations] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    apiRequest('/api/webhooks/integrations', { token })
      .then(setIntegrations)
      .catch((requestError) => setError(requestError.message))
  }, [token])

  const copyEndpoint = async (endpoint) => {
    const url = integrations?.[sources.find((source) => source.endpoint === endpoint)?.integration]?.webhookUrl
    try {
      await navigator.clipboard.writeText(url || `${window.location.origin}${endpoint}`)
      setCopied(endpoint)
      window.setTimeout(() => setCopied(''), 1800)
    } catch {
      setError('Unable to copy the webhook URL. Copy it from the displayed endpoint instead.')
    }
  }

  return (
    <>
      <PageHeader eyebrow="Lead Management" title="Lead source integrations" subtitle="Connect Meta Lead Ads, WhatsApp, website and referral forms to the central lead pool." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sources.map(({ title, leadSource, icon: Icon, integration, endpoint, description }) => {
          const config = integrations?.[integration]
          const count = leads.filter((lead) => lead.source === leadSource).length
          return (
            <section key={integration} className="card flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-brand-50 p-3 text-brand-700"><Icon size={21} /></span>
                  <div><h2 className="font-bold text-slate-900">{title}</h2><p className="text-xs text-slate-500">{count} leads received</p></div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${config?.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {config?.configured ? 'Configured' : 'Needs setup'}
                </span>
              </div>
              <p className="my-4 flex-1 text-sm leading-relaxed text-slate-500">{description}</p>
              <code className="block break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-700">{config?.webhookUrl || config?.endpoint || endpoint}</code>
              <button className="btn-outline mt-3 w-full" onClick={() => copyEndpoint(endpoint)}>
                <Copy size={14} /> {copied === endpoint ? 'Copied endpoint' : 'Copy webhook URL'}
              </button>
            </section>
          )
        })}
      </div>
      <section className="card">
        <h2 className="section-title">Website and referral webhook payload</h2>
        <p className="mb-3 text-sm text-slate-500">Send JSON from your trusted server. Never put the webhook API key in browser code.</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">{`POST /api/webhooks/leads/website
Headers:
  Content-Type: application/json
  x-api-key: <WEBSITE_WEBHOOK_SECRET>

Body:
{
  "name": "Customer name",
  "phone": "+919876543210",
  "email": "customer@example.com",
  "message": "Interested in a rooftop solar quote",
  "externalId": "your-form-submission-id"
}`}</pre>
        <p className="mt-3 text-xs text-slate-500">Leads are validated, deduplicated by source and externalId, assigned to employee accounts in rotation, and saved for the Lead Pool.</p>
      </section>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>Employees connected: {users.filter((user) => user.role === 'employee').length}</span>
        <Link to="/leads" className="font-semibold text-brand-700">Open central lead pool →</Link>
      </div>
    </>
  )
}
