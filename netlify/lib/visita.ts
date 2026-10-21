import { HttpError } from './http'

export interface DatosVisita {
  doc: string
  fecha: string
  empresa: string
  dif: number
  ali: boolean
  agua: boolean
  nec: boolean
  lab: boolean
  vac: boolean
  vacDet: string
  obs: string
  rec: string
  nor: boolean
  san: boolean
  man: boolean
  nut: boolean
  /** true = generar informe PDF → VstTcEstado 1 (aprobada/emitida); false → 0 (en revisión). */
  pdf: boolean
}

const b = (v: unknown) => (v ? 1 : 0)

/** Columnas editables de AVEn_VisitaTec2, en el mismo orden que devuelve valoresVisita(). */
export const COLUMNAS_VISITA = [
  'VstTcDoc', 'VstTcFec', 'VstTcTecEmp', 'VstTcTipDif', 'VstTcChkAli', 'VstTcChkAgua', 'VstTcNec',
  'VstTcMstLab', 'VstTcVacunas', 'VstTcVacuDet', 'VstTcObs', 'VstTcSitNor', 'VstTcSitPrbSan',
  'VstTcSitPrbMan', 'VstTcSitPrbNut', 'VstTcEstado',
]

/** Valida los datos del formulario y devuelve los valores listos para MySQL más la recomendación. */
export function valoresVisita(d: DatosVisita, inicioCria: string): { valores: unknown[]; rec: string } {
  const fecha = String(d.fecha ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new HttpError(400, 'La fecha de la visita es obligatoria.')
  if (fecha < inicioCria.slice(0, 10)) throw new HttpError(400, 'La fecha no puede ser anterior al inicio de la cría.')
  const docTxt = String(d.doc ?? '').trim()
  if (docTxt && !/^\d{1,9}$/.test(docTxt)) throw new HttpError(400, 'El documento debe ser un número.')
  const dif = Number(d.dif)
  if (![0, 1, 2].includes(dif)) throw new HttpError(400, 'Selecciona el tipo de diferencias.')
  if (!d.nor && !d.san && !d.man && !d.nut) {
    throw new HttpError(400, 'Si la situación no es normal, marca al menos un problema.')
  }
  const vacDet = d.vac ? String(d.vacDet ?? '').trim() : ''
  if (d.vac && !vacDet) throw new HttpError(400, 'Describe las vacunas colocadas.')
  const empresa = String(d.empresa ?? '').trim()
  const obs = String(d.obs ?? '').trim()
  const rec = String(d.rec ?? '').trim()
  if (vacDet.length > 50 || obs.length > 200 || rec.length > 250 || empresa.length > 50) {
    throw new HttpError(400, 'Algún texto supera el largo permitido.')
  }
  return {
    rec,
    valores: [
      docTxt ? Number(docTxt) : 0, fecha, empresa || null, dif,
      b(d.ali), b(d.agua), b(d.nec), b(d.lab), b(d.vac), vacDet, obs,
      b(d.nor), d.nor ? 0 : b(d.san), d.nor ? 0 : b(d.man), d.nor ? 0 : b(d.nut),
      b(d.pdf),
    ],
  }
}
