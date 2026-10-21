import { query, autorizacionCria } from '../lib/db'
import { handler, json, HttpError, leerSesion, idParam } from '../lib/http'

// Visitas en revisión (VstTcEstado = 0) de una cría, hechas por el técnico que ingresó.
export default handler(['GET'], async (req) => {
  const { tecId } = leerSesion(req)
  const criaId = idParam(new URL(req.url), 'cria')
  if (!(await autorizacionCria(tecId, criaId))) throw new HttpError(403, 'No tienes autorización para esta cría.')

  const rows = await query(
    `SELECT IdVstTec, VstTcFec, VstTcDoc, VstTcObs, VstTcSitNor
       FROM AVEn_VisitaTec2
      WHERE VstTcIdCria = ? AND VstTcTecId = ? AND VstTcEstado = 0
      ORDER BY VstTcFec DESC, IdVstTec DESC`,
    [criaId, tecId],
  )
  return json(200, rows)
})
