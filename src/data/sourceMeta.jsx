import { FaWhatsapp } from 'react-icons/fa6'
import { SiMeta } from 'react-icons/si'
import { FileSpreadsheet, Globe, Share2 } from 'lucide-react'

export const SOURCE_META = {
  'Meta Lead Ads': { icon: SiMeta, tone: 'bg-blue-50 text-[#0866FF]', desc: 'Facebook & Instagram lead forms' },
  WhatsApp: { icon: FaWhatsapp, tone: 'bg-[#25D366]/10 text-[#128C7E]', desc: 'Incoming WhatsApp enquiries' },
  Website: { icon: Globe, tone: 'bg-indigo-50 text-indigo-600', desc: 'Website contact / quote forms' },
  Referral: { icon: Share2, tone: 'bg-amber-50 text-amber-600', desc: 'Referral form submissions' },
  API: { icon: Globe, tone: 'bg-violet-50 text-violet-600', desc: 'External lead API submissions' },
  CSV: { icon: FileSpreadsheet, tone: 'bg-amber-50 text-amber-600', desc: 'Administrator CSV imports' },
}
