import { useNavigate, useParams } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { Cargando, MensajeError } from '../components/Estado'
import { useApi } from '../hooks/useApi'
import { fechaCorta } from '../lib/formato'
import type { VisitaRevision } from '../types'

export default function VisitasEnRevision() {
  const { idCria } = useParams()
  const navigate = useNavigate()
  const { datos, error, cargando } = useApi<VisitaRevision[]>(`revision?cria=${idCria}`)

  return (
    <div className="phone">
      <AppBar titulo="Aprobar visita" subtitulo="Tus visitas en revisión" volver="/crias" />
      <main className="screen">
        {cargando && <Cargando />}
        {error && <MensajeError texto={error} />}
        {datos && datos.length === 0 && <p className="hint centro">No tienes visitas en revisión para esta cría.</p>}
        {datos && datos.length > 0 && (
          <p className="hint">Abre una visita para corregirla. Al guardarla con “Generar informe PDF” queda aprobada.</p>
        )}
        {datos?.map((v) => (
          <button key={v.IdVstTec} className="revision" onClick={() => navigate(`/visita/${idCria}/revision/${v.IdVstTec}`)}>
            <span className="cab">
              <b>{fechaCorta(v.VstTcFec)}</b>
              <span>N.º {v.IdVstTec} · Doc. {v.VstTcDoc}</span>
            </span>
            <span className="resumen">{v.VstTcObs || 'Sin observaciones'}</span>
            <span className="pie">
              <span className={`pill ${v.VstTcSitNor ? 'on' : 'bad'}`}>{v.VstTcSitNor ? 'Situación normal' : 'Con problemas'}</span>
              <span className="abrir">Revisar ›</span>
            </span>
          </button>
        ))}
      </main>
    </div>
  )
}
