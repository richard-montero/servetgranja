import { useNavigate, useParams } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { Cargando, MensajeError } from '../components/Estado'
import { useApi } from '../hooks/useApi'
import { DIFERENCIAS, fechaCorta } from '../lib/formato'
import type { NivelAuth, VisitaAnterior } from '../types'

export default function VisitasAnteriores() {
  const { idCria } = useParams()
  const navigate = useNavigate()
  const { datos, error, cargando } = useApi<{ nivel: NivelAuth; visitas: VisitaAnterior[] }>(`visitas?cria=${idCria}`)
  const titulo = datos?.nivel === 1 ? 'Visitas de la fecha anterior' : 'Todas las visitas'

  return (
    <div className="app">
      <AppBar titulo={titulo} subtitulo="Solo lectura" volver={`/visita/${idCria}`} />
      <main className="screen">
        {cargando && <Cargando />}
        {error && <MensajeError texto={error} />}
        {datos?.nivel === 1 && datos.visitas.length > 0 && (
          <p className="hint">Visitas del {fechaCorta(datos.visitas[0].VstTcFec)}, la fecha más reciente con visitas.</p>
        )}
        {datos && datos.visitas.length === 0 && <p className="hint centro">Esta cría todavía no tiene visitas registradas.</p>}
        <div className="rejilla">
        {datos?.visitas.map((v) => {
          const checks = [
            v.VstTcChkAli && 'Alimento', v.VstTcChkAgua && 'Agua', v.VstTcNec && 'Necropsia', v.VstTcMstLab && 'Muestra lab.',
          ].filter(Boolean) as string[]
          const problemas = [
            v.VstTcSitPrbSan && 'Sanitario', v.VstTcSitPrbMan && 'Manejo', v.VstTcSitPrbNut && 'Nutricional',
          ].filter(Boolean) as string[]
          return (
            <article className="visit" key={v.IdVstTec}>
              <header>
                {fechaCorta(v.VstTcFec)}
                <span>N.º {v.IdVstTec} · Doc. {v.VstTcDoc}</span>
              </header>
              <div className="lock">{v.TecNombre ?? 'Técnico desconocido'}{v.VstTcTecEmp ? ` · ${v.VstTcTecEmp}` : ''}</div>
              <div className="pills">
                {v.VstTcEstado === 0 && <span className="pill warn">En revisión</span>}
                <span className="pill">Dif. {DIFERENCIAS[v.VstTcTipDif] ?? '—'}</span>
                {checks.map((c) => <span key={c} className="pill on">✓ {c}</span>)}
                {v.VstTcSitNor
                  ? <span className="pill on">Situación normal</span>
                  : problemas.map((p) => <span key={p} className="pill bad">Prob. {p}</span>)}
              </div>
              {!!v.VstTcVacunas && <p><b>Vacunas:</b> {v.VstTcVacuDet}</p>}
              {v.VstTcObs && <p><b>Diagnóstico:</b> {v.VstTcObs}</p>}
              {v.recomendaciones.map((r, i) => <p key={i}><b>Recomendaciones:</b> {r}</p>)}
            </article>
          )
        })}
        </div>
        <button className="btn ghost" onClick={() => navigate(`/visita/${idCria}`)}>Volver a la nueva visita</button>
      </main>
    </div>
  )
}
