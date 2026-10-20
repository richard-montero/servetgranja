import { query } from '../lib/db'
import { handler, readJson, json, HttpError, crearToken, leerSesion } from '../lib/http'

export default handler(['POST'], async (req) => {
  const sesion = leerSesion(req, true)
  const { nueva } = await readJson<{ nueva?: string }>(req)
  const clave = String(nueva ?? '')
  if (clave.length < 4) throw new HttpError(400, 'La contraseña debe tener al menos 4 caracteres.')
  if (clave.length > 25) throw new HttpError(400, 'La contraseña puede tener como máximo 25 caracteres.')
  if (clave === '123') throw new HttpError(400, 'La nueva contraseña no puede ser 123.')

  await query('UPDATE Tecnicos SET TecPassw = ? WHERE TecId = ?', [clave, sesion.tecId])
  return json(200, { token: crearToken(sesion.tecId, false) })
})
