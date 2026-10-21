import { getPool, query, autorizacionCria } from '../lib/db'
import { handler, json, HttpError, leerSesion, idParam, readJson } from '../lib/http'
import { COLUMNAS_VISITA, valoresVisita, type DatosVisita } from '../lib/visita'

interface Visita {
  IdVstTec: number
  VstTcIdCria: number
  [campo: string]: unknown
}

// Una visita en revisión, solo si es del técnico que ingresó y la cría sigue autorizada.
async function visitaEditable(tecId: number, id: number) {
  const [v] = await query<Visita>(
    `SELECT IdVstTec, VstTcIdCria, ${COLUMNAS_VISITA.join(', ')}
       FROM AVEn_VisitaTec2
      WHERE IdVstTec = ? AND VstTcTecId = ? AND VstTcEstado = 0`,
    [id, tecId],
  )
  if (!v) throw new HttpError(404, 'La visita no existe, no es tuya o ya fue aprobada.')
  const auth = await autorizacionCria(tecId, v.VstTcIdCria)
  if (!auth) throw new HttpError(403, 'No tienes autorización para esta cría o ya no está activa.')
  return { v, auth }
}

export default handler(['GET', 'PUT'], async (req) => {
  const { tecId } = leerSesion(req)
  const id = idParam(new URL(req.url), 'id')
  const { v, auth } = await visitaEditable(tecId, id)

  if (req.method === 'GET') {
    const recs = await query<{ VstTcReRec: string }>(
      'SELECT VstTcReRec FROM AVEn_VisitaTec2Rec WHERE VstTcReIdVis = ? ORDER BY IdVstTcRe',
      [id],
    )
    return json(200, { ...v, recomendacion: recs.map((r) => r.VstTcReRec).filter(Boolean).join('\n') })
  }

  const { valores, rec } = valoresVisita(await readJson<DatosVisita>(req), auth.CrFecInicio)
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    await conn.query(
      `UPDATE AVEn_VisitaTec2 SET ${COLUMNAS_VISITA.map((c) => `${c} = ?`).join(', ')}
        WHERE IdVstTec = ? AND VstTcTecId = ? AND VstTcEstado = 0`,
      [...valores, id, tecId],
    )
    // La recomendación se reemplaza: si quedó vacía, no queda ningún registro en AVEn_VisitaTec2Rec.
    await conn.query('DELETE FROM AVEn_VisitaTec2Rec WHERE VstTcReIdVis = ?', [id])
    if (rec) {
      await conn.query('INSERT INTO AVEn_VisitaTec2Rec (VstTcReIdVis, VstTcReRec) VALUES (?, ?)', [id, rec])
    }
    await conn.commit()
    return json(200, { id })
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
})
