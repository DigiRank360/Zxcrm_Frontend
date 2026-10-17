import { FaFacebookF, FaWhatsapp } from 'react-icons/fa6'
import { SiMeta } from 'react-icons/si'
import { Globe, FileSpreadsheet } from 'lucide-react'

export const SOURCE_META = {
  Facebook: { icon: FaFacebookF, tone: 'bg-[#1877F2]/10 text-[#1877F2]', desc: 'Facebook page & lead-ad enquiries' },
  'Meta Ads': { icon: SiMeta, tone: 'bg-blue-50 text-[#0866FF]', desc: 'Facebook & Instagram lead forms' },
  WhatsApp: { icon: FaWhatsapp, tone: 'bg-[#25D366]/10 text-[#128C7E]', desc: 'Incoming WhatsApp enquiries' },
  Website: { icon: Globe, tone: 'bg-indigo-50 text-indigo-600', desc: 'Website contact / quote forms' },
  CSV: { icon: FileSpreadsheet, tone: 'bg-amber-50 text-amber-600', desc: 'Bulk upload from CSV file (name, phone)' },
}

