import type { ResultSetHeader } from 'mysql2'
import { getPool, query, autorizacionCria } from '../lib/db'
import { handler, json, HttpError, leerSesion, idParam, readJson } from '../lib/http'
import { COLUMNAS_VISITA, valoresVisita, type DatosVisita } from '../lib/visita'

interface VisitaRow {
  IdVstTec: number
  VstTcDoc: number
  VstTcFec: string
  VstTcTecEmp: string | null
  VstTcTipDif: number
  VstTcChkAli: number
  VstTcChkAgua: number
  VstTcNec: number
  VstTcMstLab: number
  VstTcVacunas: number
  VstTcVacuDet: string | null
  VstTcObs: string | null
  VstTcSitNor: number
  VstTcSitPrbSan: number
  VstTcSitPrbMan: number
  VstTcSitPrbNut: number
  VstTcEstado: number
  TecNombre: string | null
  VstTcReRec: string | null
}

export default handler(['GET', 'POST'], async (req) => {
  const { tecId } = leerSesion(req)
  return req.method === 'GET' ? listar(req, tecId) : guardar(req, tecId)
})

// Nivel 1: visitas de la fecha más reciente con visitas. Nivel 2: todas. De cualquier técnico.
async function listar(req: Request, tecId: number) {
  const criaId = idParam(new URL(req.url), 'cria')
  const auth = await autorizacionCria(tecId, criaId)
  if (!auth) throw new HttpError(403, 'No tienes autorización para esta cría.')
  if (auth.NivelAuth < 1) throw new HttpError(403, 'Tu nivel de autorización no permite ver visitas anteriores.')

  const soloUltimaFecha = auth.NivelAuth === 1
    ? `AND DATE(v.VstTcFec) = (SELECT DATE(MAX(x.VstTcFec)) FROM AVEn_VisitaTec2 x WHERE x.VstTcIdCria = ?)`
    : ''
  const params = auth.NivelAuth === 1 ? [criaId, criaId] : [criaId]

  const rows = await query<VisitaRow>(
    `SELECT v.IdVstTec, v.VstTcDoc, v.VstTcFec, v.VstTcTecEmp, v.VstTcTipDif, v.VstTcChkAli, v.VstTcChkAgua,
            v.VstTcNec, v.VstTcMstLab, v.VstTcVacunas, v.VstTcVacuDet, v.VstTcObs, v.VstTcSitNor,
            v.VstTcSitPrbSan, v.VstTcSitPrbMan, v.VstTcSitPrbNut, v.VstTcEstado, t.TecNombre, r.VstTcReRec
       FROM AVEn_VisitaTec2 v
       LEFT JOIN Tecnicos t ON t.TecId = v.VstTcTecId
       LEFT JOIN AVEn_VisitaTec2Rec r ON r.VstTcReIdVis = v.IdVstTec
      WHERE v.VstTcIdCria = ? ${soloUltimaFecha}
      ORDER BY v.VstTcFec DESC, v.IdVstTec DESC, r.IdVstTcRe`,
    params,
  )

  // Una visita puede traer varias filas si tuviera más de una recomendación.
  const porId = new Map<number, VisitaRow & { recomendaciones: string[] }>()
  for (const r of rows) {
    const v = porId.get(r.IdVstTec) ?? { ...r, recomendaciones: [] }
    if (r.VstTcReRec) v.recomendaciones.push(r.VstTcReRec)
    porId.set(r.IdVstTec, v)
  }
  return json(200, { nivel: auth.NivelAuth, visitas: [...porId.values()].map(({ VstTcReRec: _, ...v }) => v) })
}

async function guardar(req: Request, tecId: number) {
  const d = await readJson<DatosVisita & { idCria: number }>(req)
  const criaId = Number(d.idCria)
  if (!Number.isInteger(criaId) || criaId <= 0) throw new HttpError(400, 'Cría inválida.')
  const auth = await autorizacionCria(tecId, criaId)
  if (!auth) throw new HttpError(403, 'No tienes autorización para esta cría o ya no está activa.')
  const { valores, rec } = valoresVisita(d, auth.CrFecInicio)

  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO AVEn_VisitaTec2 (VstTcIdCria, VstTcTecId, ${COLUMNAS_VISITA.join(', ')})
       VALUES (?, ?, ${COLUMNAS_VISITA.map(() => '?').join(', ')})`,
      [criaId, tecId, ...valores],
    )
    if (rec) {
      await conn.query('INSERT INTO AVEn_VisitaTec2Rec (VstTcReIdVis, VstTcReRec) VALUES (?, ?)', [res.insertId, rec])
    }
    await conn.commit()
    return json(201, { id: res.insertId })
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
