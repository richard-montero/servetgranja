import { query } from '../lib/db'
import { handler, readJson, json, HttpError, crearToken } from '../lib/http'

interface Tecnico {
  TecId: number
  TecNombre: string
  TecEmpresa: string | null
  TecPassw: string
}

export default handler(['POST'], async (req) => {
  const { celular, password } = await readJson<{ celular?: string; password?: string }>(req)
  const cel = String(celular ?? '').trim()
  if (!cel) throw new HttpError(400, 'Escribe tu número de celular.')
  if (!password) throw new HttpError(400, 'Escribe tu contraseña.')

  const [tec] = await query<Tecnico>(
    'SELECT TecId, TecNombre, TecEmpresa, TecPassw FROM Tecnicos WHERE TecCelular = ? LIMIT 1',
    [cel],
  )
  if (!tec) throw new HttpError(404, 'Este celular no está registrado. Pide al administrador que te dé de alta.')
  if (tec.TecPassw !== password) throw new HttpError(401, 'La contraseña no es correcta.')

  const cambio = tec.TecPassw === '123'
  return json(200, {
    token: crearToken(tec.TecId, cambio),
    debeCambiarClave: cambio,
    tecnico: { id: tec.TecId, nombre: tec.TecNombre, empresa: tec.TecEmpresa ?? '' },
  })
})
