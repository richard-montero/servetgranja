import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { MensajeError } from '../components/Estado'
import { useAuth } from '../hooks/useAuth'
import { almacen } from '../lib/api'

export default function Login() {
  const { sesion, ingresar } = useAuth()
  const navigate = useNavigate()
  const [celular, setCelular] = useState(() => almacen.celular())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (sesion) return <Navigate to={sesion.debeCambiarClave ? '/cambiar-clave' : '/crias'} replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!celular.trim()) return setError('Escribe tu número de celular.')
    if (!password) return setError('Escribe tu contraseña.')
    setEnviando(true)
    try {
      const s = await ingresar(celular, password)
      navigate(s.debeCambiarClave ? '/cambiar-clave' : '/crias', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="phone">
      <AppBar titulo="SerVetGranja" subtitulo="Visitas técnicas avícolas" />
      <form className="screen" onSubmit={enviar} noValidate>
        <div className="brand">
          <div className="mark">
            <img src="/pollo.jpg" alt="Pollo de engorde" />
          </div>
          <h2>Bienvenido</h2>
          <p>Ingresa con tu celular registrado</p>
        </div>
        <div>
          <label className="lbl" htmlFor="cel">Celular</label>
          <input id="cel" type="tel" inputMode="numeric" autoComplete="tel" value={celular} onChange={(e) => setCelular(e.target.value)} />
          {almacen.celular() && <p className="hint">Recordado en este dispositivo desde tu último ingreso.</p>}
        </div>
        <div>
          <label className="lbl" htmlFor="pw">Contraseña</label>
          <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <MensajeError texto={error} />}
        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <div className="credit">
          <img src="/ramnsoft.png" alt="" />
          Desarrollado por RAMN Software
        </div>
      </form>
    </div>
  )
}
