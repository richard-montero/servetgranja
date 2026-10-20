import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { MensajeError } from '../components/Estado'
import { useAuth } from '../hooks/useAuth'

export default function CambiarClave() {
  const { cambiarClave, salir } = useAuth()
  const navigate = useNavigate()
  const [nueva, setNueva] = useState('')
  const [repite, setRepite] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const valida = nueva.length >= 4 && nueva.length <= 25 && nueva !== '123' && nueva === repite

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!valida) return
    setEnviando(true)
    setError('')
    try {
      await cambiarClave(nueva)
      navigate('/crias', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="phone">
      <AppBar titulo="Cambia tu contraseña" subtitulo="Primer ingreso o clave reiniciada" />
      <form className="screen" onSubmit={enviar} noValidate>
        <div className="notice">
          Tu contraseña actual es la clave inicial <b>123</b>. Debes cambiarla para continuar.
        </div>
        <div>
          <label className="lbl" htmlFor="np">Nueva contraseña</label>
          <input id="np" type="password" autoComplete="new-password" maxLength={25} value={nueva} onChange={(e) => setNueva(e.target.value)} />
        </div>
        <div>
          <label className="lbl" htmlFor="np2">Repite la contraseña</label>
          <input id="np2" type="password" autoComplete="new-password" maxLength={25} value={repite} onChange={(e) => setRepite(e.target.value)} />
        </div>
        <p className="hint">Entre 4 y 25 caracteres, distinta de 123.</p>
        {repite && nueva !== repite && <MensajeError texto="Las contraseñas no coinciden." />}
        {error && <MensajeError texto={error} />}
        <button className="btn" type="submit" disabled={!valida || enviando}>
          {enviando ? 'Guardando…' : 'Guardar y continuar'}
        </button>
        <button className="btn ghost" type="button" onClick={salir}>
          Salir
        </button>
      </form>
    </div>
  )
}
