import type { ResultSetHeader } from 'mysql2'
import { getPool, query, autorizacionCria } from '../lib/db'
import { handler, json, HttpError, leerSesion, idParam, readJson } from '../lib/http'

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
  TecNombre: string | null
  VstTcReRec: string | null
}

interface NuevaVisita {
  idCria: number
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
}

const b = (v: unknown) => (v ? 1 : 0)

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
            v.VstTcSitPrbSan, v.VstTcSitPrbMan, v.VstTcSitPrbNut, t.TecNombre, r.VstTcReRec
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
  const d = await readJson<NuevaVisita>(req)
  const criaId = Number(d.idCria)
  if (!Number.isInteger(criaId) || criaId <= 0) throw new HttpError(400, 'Cría inválida.')
  const auth = await autorizacionCria(tecId, criaId)
  if (!auth) throw new HttpError(403, 'No tienes autorización para esta cría o ya no está activa.')

  const fecha = String(d.fecha ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new HttpError(400, 'La fecha de la visita es obligatoria.')
  if (fecha < auth.CrFecInicio.slice(0, 10)) {
    throw new HttpError(400, 'La fecha no puede ser anterior al inicio de la cría.')
  }
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

  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO AVEn_VisitaTec2
         (VstTcIdCria, VstTcDoc, VstTcFec, VstTcTecId, VstTcTecEmp, VstTcTipDif, VstTcChkAli, VstTcChkAgua,
          VstTcNec, VstTcMstLab, VstTcVacunas, VstTcVacuDet, VstTcObs, VstTcSitNor, VstTcSitPrbSan,
          VstTcSitPrbMan, VstTcSitPrbNut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        criaId, docTxt ? Number(docTxt) : 0, fecha, tecId, empresa || null, dif,
        b(d.ali), b(d.agua), b(d.nec), b(d.lab), b(d.vac), vacDet, obs,
        b(d.nor), d.nor ? 0 : b(d.san), d.nor ? 0 : b(d.man), d.nor ? 0 : b(d.nut),
      ],
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
