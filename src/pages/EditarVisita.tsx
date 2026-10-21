import { useParams } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { EditorVisita } from '../components/EditorVisita'
import { Cargando, MensajeError } from '../components/Estado'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import type { CriaDetalle, FormVisita, VisitaEditable } from '../types'

function aFormulario(v: VisitaEditable): FormVisita {
  return {
    doc: v.VstTcDoc ? String(v.VstTcDoc) : '',
    fecha: v.VstTcFec.slice(0, 10),
    empresa: v.VstTcTecEmp ?? '',
    dif: ([0, 1, 2].includes(v.VstTcTipDif) ? v.VstTcTipDif : 2) as 0 | 1 | 2,
    ali: !!v.VstTcChkAli,
    agua: !!v.VstTcChkAgua,
    nec: !!v.VstTcNec,
    lab: !!v.VstTcMstLab,
    vac: !!v.VstTcVacunas,
    vacDet: v.VstTcVacuDet ?? '',
    obs: v.VstTcObs ?? '',
    rec: v.recomendacion ?? '',
    nor: !!v.VstTcSitNor,
    san: !!v.VstTcSitPrbSan,
    man: !!v.VstTcSitPrbMan,
    nut: !!v.VstTcSitPrbNut,
  }
}

export default function EditarVisita() {
  const { idCria, idVisita } = useParams()
  const volver = `/visita/${idCria}/revision`
  const cria = useApi<CriaDetalle>(`cria?id=${idCria}`)
  const visita = useApi<VisitaEditable>(`visita?id=${idVisita}`)

  if (!cria.datos || !visita.datos) {
    return (
      <div className="phone">
        <AppBar titulo="Aprobar visita" volver={volver} />
        <main className="screen">
          {(cria.cargando || visita.cargando) && <Cargando />}
          {(cria.error || visita.error) && <MensajeError texto={cria.error || visita.error} />}
        </main>
      </div>
    )
  }

  const v = visita.datos
  return (
    <EditorVisita
      key={v.IdVstTec}
      cria={cria.datos}
      inicial={aFormulario(v)}
      titulo="Aprobar visita"
      volver={volver}
      encabezado={<div className="notice">Visita N.º {v.IdVstTec} en revisión. Puedes corregir cualquier dato.</div>}
      onGuardar={async (f, pdf) => {
        await api(`visita?id=${v.IdVstTec}`, { method: 'PUT', body: { ...f, pdf } })
        return v.IdVstTec
      }}
    />
  )
}
