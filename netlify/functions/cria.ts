import { query, autorizacionCria } from '../lib/db'
import { handler, json, HttpError, leerSesion, idParam } from '../lib/http'

// Datos de la cría seleccionada (cabecera del formulario de visita).
export default handler(['GET'], async (req) => {
  const { tecId } = leerSesion(req)
  const criaId = idParam(new URL(req.url), 'id')
  const auth = await autorizacionCria(tecId, criaId)
  if (!auth) throw new HttpError(403, 'No tienes autorización para esta cría o ya no está activa.')

  const [cria] = await query<Record<string, unknown>>(
    `SELECT AVEn_Galpones.GlpNombre, AVEnG_Cria.CrFecInicio, AVEn_Raza.Raza, AVEnG_Cria.CrSexo,
            AVEnG_Cria.CrFecIngreso, AVEnG_Cria.IdCria, Emp_Personal.PerNombre,
            AVEn_Granjas.GrjNombre, Empresas.EmpNombre
       FROM AVEnG_Cria
       INNER JOIN AVEn_Galpones ON AVEn_Galpones.IdGalpon = AVEnG_Cria.CrIdGalpon
       INNER JOIN AVEn_Raza ON AVEn_Raza.IdRaza = AVEnG_Cria.CrIdRaza
       INNER JOIN Emp_Personal ON Emp_Personal.IdPersonal = AVEnG_Cria.CrIdEncargado
       INNER JOIN AVEn_Granjas ON AVEn_Galpones.GlpIdGranja = AVEn_Granjas.IdGranja
       INNER JOIN Empresas ON AVEn_Granjas.IdEmpresa = Empresas.EmpId
      WHERE AVEnG_Cria.IdCria = ?`,
    [criaId],
  )
  if (!cria) throw new HttpError(404, 'No se encontró la cría.')
  return json(200, { ...cria, NivelAuth: auth.NivelAuth })
})
