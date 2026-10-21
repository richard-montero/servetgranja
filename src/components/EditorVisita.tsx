import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar } from './AppBar'
import { MensajeError } from './Estado'
import { FichaCria } from './FichaCria'
import { useAuth } from '../hooks/useAuth'
import { DIFERENCIAS, fechaCorta } from '../lib/formato'
import { generarInforme } from '../lib/informePdf'
import type { CriaDetalle, FormVisita } from '../types'

type Pestana = 'obs' | 'rec' | 'sit'
type Bool = 'ali' | 'agua' | 'nec' | 'lab' | 'vac' | 'nor' | 'san' | 'man' | 'nut'

interface Props {
  cria: CriaDetalle
  inicial: FormVisita
  titulo: string
  volver: string
  /** Contenido extra bajo la ficha (botón de visitas anteriores, aviso de revisión…). */
  encabezado?: ReactNode
  /** Guarda en la API y devuelve el N.º de visita. pdf = true → VstTcEstado 1. */
  onGuardar: (f: FormVisita, pdf: boolean) => Promise<number>
}

/** Formulario de visita técnica, compartido por "Nueva visita" y "Aprobar visita". */
export function EditorVisita({ cria, inicial, titulo, volver, encabezado, onGuardar }: Props) {
  const navigate = useNavigate()
  const { sesion } = useAuth()
  const [f, setF] = useState<FormVisita>(inicial)
  const [pdf, setPdf] = useState(true)
  const [tab, setTab] = useState<Pestana>('obs')
  const [enviando, setEnviando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')

  const inicio = cria.CrFecInicio.slice(0, 10)
  // Si la fecha propuesta es anterior al inicio de la cría, propone la fecha de inicio.
  useEffect(() => {
    setF((p) => (p.fecha < inicio ? { ...p, fecha: inicio } : p))
  }, [inicio])

  const set = <K extends keyof FormVisita>(k: K, v: FormVisita[K]) => setF((p) => ({ ...p, [k]: v }))
  const marcar = (k: Bool, v: boolean) =>
    setF((p) => ({
      ...p,
      [k]: v,
      ...(k === 'nor' && v ? { san: false, man: false, nut: false } : {}),
      ...(k === 'vac' && !v ? { vacDet: '' } : {}),
    }))

  const errFecha = !f.fecha
    ? 'La fecha de la visita es obligatoria.'
    : f.fecha < inicio
      ? `La fecha no puede ser anterior al inicio de la cría (${fechaCorta(inicio)}).`
      : ''
  const errDoc = f.doc && !/^\d{1,9}$/.test(f.doc) ? 'El documento debe ser un número.' : ''
  const errSit = !f.nor && !f.san && !f.man && !f.nut ? 'Sin “Normal”, marca al menos un problema.' : ''
  const errVac = f.vac && !f.vacDet.trim() ? 'Describe las vacunas colocadas.' : ''
  const puedeGuardar = !errFecha && !errDoc && !errSit && !errVac && !enviando

  async function guardar() {
    if (!puedeGuardar) return
    setEnviando(true)
    setErrorGuardar('')
    let id: number
    try {
      id = await onGuardar(f, pdf)
    } catch (e) {
      setErrorGuardar((e as Error).message)
      setEnviando(false)
      return
    }
    let aviso = pdf ? `${cria.GlpNombre} · N.º ${id} aprobada` : `${cria.GlpNombre} · N.º ${id} en revisión`
    if (pdf) {
      try {
        const nombre = await generarInforme({ id, cria, f, tecnico: sesion?.tecnico.nombre ?? '' })
        aviso += ` · informe ${nombre}`
      } catch {
        aviso += ' · no se pudo generar el PDF'
      }
    }
    navigate('/crias', { replace: true, state: { guardada: aviso } })
  }

  const chk = (k: Bool, texto: string, disabled = false) => (
    <label className="chk">
      <input type="checkbox" id={`c_${k}`} checked={f[k]} disabled={disabled} onChange={(e) => marcar(k, e.target.checked)} />
      {texto}
    </label>
  )

  return (
    <div className="app">
      <AppBar titulo={titulo} subtitulo={`${cria.EmpNombre} – ${cria.GrjNombre}`} volver={volver} />
      <main className="screen editor">
        <div className="col">
        <FichaCria cria={cria} />
        {encabezado}
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
        </div>

        <div className="col">
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
        </div>
      </main>
      <footer className="footer">
        <label className="chk pdf">
          <input type="checkbox" id="c_pdf" checked={pdf} onChange={(e) => setPdf(e.target.checked)} />
          <span>
            Generar informe PDF
            <small>{pdf ? 'La visita queda aprobada y se descarga el informe.' : 'La visita queda en revisión, sin informe.'}</small>
          </span>
        </label>
        <div className="row">
          <button className="btn ghost" onClick={() => navigate(volver)}>Cancelar</button>
          <button className="btn" disabled={!puedeGuardar} onClick={guardar}>
            {enviando ? (pdf ? 'Generando…' : 'Guardando…') : 'Guardar'}
          </button>
        </div>
      </footer>
    </div>
  )
}
