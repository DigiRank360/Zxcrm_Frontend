import { useEffect, useState } from 'react'

export default function useNow(active = true) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!active) return undefined
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [active])
  return now
}
