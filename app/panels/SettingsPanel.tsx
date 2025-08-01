'use client'

import { useTheme } from '../theme-context'

export default function SettingsPanel() {
  const { theme, setTheme } = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1>Choose Theme</h1>
      <div>
        <button type="button" onClick={() => setTheme('cyber')}>Cyber</button>
        <button type="button" onClick={() => setTheme('pastel')} style={{ marginLeft: '1rem' }}>
          Pastel
        </button>
      </div>
      <p>Current theme: {theme}</p>
    </div>
  )
}
