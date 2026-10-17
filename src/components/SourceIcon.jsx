import { SOURCE_META } from '../data/sourceMeta'

export default function SourceIcon({ source, size = 14 }) {
  const Icon = SOURCE_META[source]?.icon
  return Icon ? <Icon size={size} /> : null
}
