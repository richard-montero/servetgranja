import { query } from '../lib/db'
import { handler, json, leerSesion } from '../lib/http'

// Crías activas (CrEstado = 0) que el técnico tiene autorizadas.
export default handler(['GET'], async (req) => {
  const { tecId } = leerSesion(req)
  const rows = await query(
    `SELECT Empresas.EmpId, Empresas.EmpNombre, AVEn_Granjas.GrjNombre, AVEn_Galpones.GlpNombre,
            AVEnG_Cria.IdCria, AVEnG_Cria.CrFecInicio, TecCriaAuth.NivelAuth,
            (SELECT COUNT(*) FROM AVEn_VisitaTec2 v
              WHERE v.VstTcIdCria = AVEnG_Cria.IdCria AND v.VstTcTecId = Tecnicos.TecId AND v.VstTcEstado = 0
            ) AS EnRevision
       FROM AVEnG_Cria
       INNER JOIN TecCriaAuth ON AVEnG_Cria.IdCria = TecCriaAuth.CriaId
       INNER JOIN Tecnicos ON Tecnicos.TecId = TecCriaAuth.TecId
       INNER JOIN AVEn_Galpones ON AVEnG_Cria.CrIdGalpon = AVEn_Galpones.IdGalpon
       INNER JOIN AVEn_Granjas ON AVEn_Galpones.GlpIdGranja = AVEn_Granjas.IdGranja
       INNER JOIN Empresas ON AVEn_Granjas.IdEmpresa = Empresas.EmpId
      WHERE AVEnG_Cria.CrEstado = 0 AND Tecnicos.TecId = ?
      ORDER BY Empresas.EmpNombre, AVEn_Granjas.GrjNombre, AVEn_Galpones.GlpNombre, AVEnG_Cria.CrFecInicio`,
    [tecId],
  )
  return json(200, rows)
})
