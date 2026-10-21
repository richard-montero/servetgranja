import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { Cargando, MensajeError } from '../components/Estado'
import { useApi } from '../hooks/useApi'
import { fechaCorta, NIVEL_ETIQUETA } from '../lib/formato'
import type { CriaLista } from '../types'

export default function Crias() {
  const { datos, error, cargando } = useApi<CriaLista[]>('crias')
  const navigate = useNavigate()
  const location = useLocation()
  const [aviso] = useState<string | undefined>(() => (location.state as { guardada?: string } | null)?.guardada)

  // Limpia el aviso del historial para que no reaparezca al refrescar.
  useEffect(() => {
    if (aviso) navigate(location.pathname, { replace: true, state: null })
  }, [aviso, navigate, location.pathname])

  const grupos = new Map<string, CriaLista[]>()
  for (const c of datos ?? []) {
    const k = `${c.EmpNombre} – ${c.GrjNombre}`
    grupos.set(k, [...(grupos.get(k) ?? []), c])
  }

  return (
    <div className="app">
      <AppBar titulo="Visita técnica" subtitulo="Crías activas autorizadas" />
      <main className="screen">
        {aviso && <div className="toast">Visita guardada · {aviso}</div>}
        {cargando && <Cargando />}
        {error && <MensajeError texto={error} />}
        {datos && datos.length === 0 && (
          <p className="hint centro">No tienes crías activas autorizadas. Pide a la empresa que te dé acceso.</p>
        )}
        {[...grupos].map(([titulo, lista]) => (
          <section className="group" key={titulo}>
            <h2>
              {titulo} <span>{lista.length}</span>
            </h2>
            <div className="rejilla">
            {lista.map((c) => (
              <div className="cria" key={c.IdCria}>
                <b>
                  {c.GlpNombre}
                  <span className={`chip n${c.NivelAuth}`}>{NIVEL_ETIQUETA[c.NivelAuth]}</span>
                </b>
                <div className="acciones">
                  <button className="go" onClick={() => navigate(`/visita/${c.IdCria}`)}>
                    Visita técnica
                  </button>
                  {c.EnRevision > 0 && (
                    <button className="go aprobar" onClick={() => navigate(`/visita/${c.IdCria}/revision`)}>
                      Aprobar visita ({c.EnRevision})
                    </button>
                  )}
                </div>
                <span className="meta">Inicio cría {fechaCorta(c.CrFecInicio)}</span>
              </div>
            ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
