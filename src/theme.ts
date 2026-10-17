import { useEffect, useLayoutEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'site-theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

// A saved choice wins; otherwise follow the device. (The old hero-only setting still counts.)
function saved(): Theme | null {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'light' || value === 'dark') return value
    if (localStorage.getItem('valley-night') === '1') return 'dark'
  } catch { /* storage unavailable */ }
  return null
}

// Day or night for the whole site. The CSS already follows the device before this runs,
// so the attribute only matters once someone picks a side.
export function useTheme() {
  const [choice, setChoice] = useState<Theme | null>(saved)
  const [device, setDevice] = useState<Theme>(() => media().matches ? 'dark' : 'light')
  const theme = choice ?? device

  useEffect(() => {
    const query = media()
    const onChange = () => setDevice(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111a3a' : '#8cc8f0')
  }, [theme])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(KEY, next) } catch { /* storage unavailable */ }
    setChoice(next)
  }
  return { theme, toggle }
}
