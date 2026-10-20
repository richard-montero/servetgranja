import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Props {
  titulo: string
  subtitulo?: string
  volver?: string
}

export function AppBar({ titulo, subtitulo, volver }: Props) {
  const { sesion, salir } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="appbar">
      {volver && (
        <button className="back" aria-label="Volver" onClick={() => navigate(volver)}>
          ‹
        </button>
      )}
      <span className="logo" title="RAMN Software">
        <img src="/ramnsoft.png" alt="RAMN Software" />
      </span>
      <h1>
        {titulo}
        {subtitulo && <small>{subtitulo}</small>}
      </h1>
      {sesion && !sesion.debeCambiarClave && (
        <div className="who">
          {sesion.tecnico.nombre}
          <br />
          <button className="link" onClick={salir}>
            Salir
          </button>
        </div>
      )}
    </header>
  )
}
