import { useState } from 'react'

interface Props {
  id: string
  value: string
  onChange: (v: string) => void
  autoComplete: 'current-password' | 'new-password'
  maxLength?: number
}

/** Campo de contraseña con botón propio para ver u ocultar, igual en todos los sistemas. */
export function CampoClave({ id, value, onChange, autoComplete, maxLength }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="clave">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="ojo"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {!visible && <path d="M4 20 20 4" />}
        </svg>
      </button>
    </div>
  )
}
