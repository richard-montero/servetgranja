import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { Cargando, MensajeError } from '../components/Estado'
import { FichaCria } from '../components/FichaCria'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { DIFERENCIAS, fechaCorta, hoyISO } from '../lib/formato'
import type { CriaDetalle, FormVisita } from '../types'

type Pestana = 'obs' | 'rec' | 'sit'
type Bool = 'ali' | 'agua' | 'nec' | 'lab' | 'vac' | 'nor' | 'san' | 'man' | 'nut'

export default function NuevaVisita() {
  const { idCria } = useParams()
  const navigate = useNavigate()
  const { sesion } = useAuth()
  const { datos: cria, error, cargando } = useApi<CriaDetalle>(`cria?id=${idCria}`)
  const [tab, setTab] = useState<Pestana>('obs')
  const [enviando, setEnviando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [f, setF] = useState<FormVisita>({
    doc: '', fecha: hoyISO(), empresa: sesion?.tecnico.empresa ?? '', dif: 2,
    ali: false, agua: false, nec: false, lab: false, vac: false, vacDet: '',
    obs: '', rec: '', nor: true, san: false, man: false, nut: false,
  })

  // Si hoy es anterior al inicio de la cría, propone la fecha de inicio.
  useEffect(() => {
    const ini = cria?.CrFecInicio.slice(0, 10)
    if (ini) setF((p) => (p.fecha < ini ? { ...p, fecha: ini } : p))
  }, [cria])

  const set = <K extends keyof FormVisita>(k: K, v: FormVisita[K]) => setF((p) => ({ ...p, [k]: v }))
  const marcar = (k: Bool, v: boolean) =>
    setF((p) => ({
      ...p,
      [k]: v,
      ...(k === 'nor' && v ? { san: false, man: false, nut: false } : {}),
      ...(k === 'vac' && !v ? { vacDet: '' } : {}),
    }))

  const inicio = cria?.CrFecInicio.slice(0, 10) ?? ''
  const errFecha = !f.fecha
    ? 'La fecha de la visita es obligatoria.'
    : inicio && f.fecha < inicio
      ? `La fecha no puede ser anterior al inicio de la cría (${fechaCorta(inicio)}).`
      : ''
  const errDoc = f.doc && !/^\d{1,9}$/.test(f.doc) ? 'El documento debe ser un número.' : ''
  const errSit = !f.nor && !f.san && !f.man && !f.nut ? 'Sin “Normal”, marca al menos un problema.' : ''
  const errVac = f.vac && !f.vacDet.trim() ? 'Describe las vacunas colocadas.' : ''
  const puedeGuardar = !errFecha && !errDoc && !errSit && !errVac && !enviando

  async function guardar() {
    if (!cria || !puedeGuardar) return
    setEnviando(true)
    setErrorGuardar('')
    try {
      const { id } = await api<{ id: number }>('visitas', { method: 'POST', body: { ...f, idCria: cria.IdCria } })
      navigate('/crias', { replace: true, state: { guardada: `${cria.GlpNombre} · N.º ${id}` } })
    } catch (e) {
      setErrorGuardar((e as Error).message)
      setEnviando(false)
    }
  }

  const chk = (k: Bool, texto: string, disabled = false) => (
    <label className="chk">
      <input type="checkbox" id={`c_${k}`} checked={f[k]} disabled={disabled} onChange={(e) => marcar(k, e.target.checked)} />
      {texto}
    </label>
  )

  return (
    <div className="phone">
      <AppBar titulo="Nueva visita" subtitulo={cria ? `${cria.EmpNombre} – ${cria.GrjNombre}` : undefined} volver="/crias" />
      <main className="screen">
        {cargando && <Cargando />}
        {error && <MensajeError texto={error} />}
        {cria && (
          <>
            <FichaCria cria={cria} />
            {cria.NivelAuth > 0 && (
              <button className="btn ghost" onClick={() => navigate(`/visita/${cria.IdCria}/anteriores`)}>
                Ver {cria.NivelAuth === 1 ? 'visitas de la fecha anterior' : 'todas las visitas'}
              </button>
            )}
            <div className="row">
              <div>
                <label className="lbl" htmlFor="doc">Documento</label>
                <input id="doc" type="text" inputMode="numeric" placeholder="0" value={f.doc} onChange={(e) => set('doc', e.target.value)} />
              </div>
              <div>
                <label className="lbl" htmlFor="fe">Fecha *</label>
                <input id="fe" type="date" min={inicio} value={f.fecha} onChange={(e) => set('fecha', e.target.value)} />
              </div>
            </div>
            {(errFecha || errDoc) && <MensajeError texto={errFecha || errDoc} />}
            <div>
              <label className="lbl" htmlFor="tec">Técnico</label>
              <input id="tec" type="text" value={sesion?.tecnico.nombre ?? ''} disabled />
            </div>
            <div>
              <label className="lbl" htmlFor="em">Empresa del técnico</label>
              <input id="em" type="text" maxLength={50} value={f.empresa} onChange={(e) => set('empresa', e.target.value)} />
            </div>

            <div className="tabs" role="tablist">
              {([['obs', 'Observaciones', errVac], ['rec', 'Recomend.', ''], ['sit', 'Situación', errSit]] as const).map(([k, t, pend]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                  {t}
                  {pend && <span className="dot" aria-label="pendiente" />}
                </button>
              ))}
            </div>

            {tab === 'obs' && (
              <>
                <fieldset>
                  <legend>Diferencias</legend>
                  <div className="seg">
                    {DIFERENCIAS.map((t, i) => (
                      <label key={t} className={f.dif === i ? 'on' : ''}>
                        <input type="radio" name="dif" checked={f.dif === i} onChange={() => set('dif', i as 0 | 1 | 2)} />
                        {t}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="checks">
                  {chk('ali', 'Chequeo de alimento')}
                  {chk('agua', 'Chequeo agua de bebida')}
                  {chk('nec', 'Necropsia')}
                  {chk('lab', 'Muestra laboratorio')}
                </div>
                {chk('vac', 'Se colocaron vacunas')}
                <div>
                  <label className="lbl" htmlFor="vd">Detalle de vacunas</label>
                  <input id="vd" type="text" maxLength={50} disabled={!f.vac} value={f.vacDet}
                    placeholder={f.vac ? 'Ej. Newcastle + Bronquitis, ocular' : 'Marca “Se colocaron vacunas”'}
                    onChange={(e) => set('vacDet', e.target.value)} />
                  <div className="counter">{f.vacDet.length}/50</div>
                  {errVac && <MensajeError texto={errVac} />}
                </div>
                <div>
                  <label className="lbl" htmlFor="ob">Observaciones (diagnóstico)</label>
                  <textarea id="ob" maxLength={200} value={f.obs} onChange={(e) => set('obs', e.target.value)} />
                  <div className="counter">{f.obs.length}/200</div>
                </div>
              </>
            )}

            {tab === 'rec' && (
              <div>
                <label className="lbl" htmlFor="rc">Recomendaciones</label>
                <textarea id="rc" className="alta" maxLength={250} value={f.rec} placeholder="Opcional. Si queda vacío no se guarda recomendación."
                  onChange={(e) => set('rec', e.target.value)} />
                <div className="counter">{f.rec.length}/250</div>
              </div>
            )}

            {tab === 'sit' && (
              <>
                <fieldset>
                  <legend>Situación del lote</legend>
                  <div className="stack">
                    {chk('nor', 'Normal')}
                    <div className="stack sangria">
                      {chk('san', 'Problema sanitario', f.nor)}
                      {chk('man', 'Problema de manejo', f.nor)}
                      {chk('nut', 'Problema nutricional', f.nor)}
                    </div>
                  </div>
                </fieldset>
                {errSit ? <MensajeError texto={errSit} /> : <p className="hint">Con “Normal” marcado los problemas quedan bloqueados.</p>}
              </>
            )}
            {errorGuardar && <MensajeError texto={errorGuardar} />}
          </>
        )}
      </main>
      {cria && (
        <footer className="footer">
          <button className="btn ghost" onClick={() => navigate('/crias')}>Cancelar</button>
          <button className="btn" disabled={!puedeGuardar} onClick={guardar}>{enviando ? 'Guardando…' : 'Guardar'}</button>
        </footer>
      )}
    </div>
  )
}
