import { createHmac, createHash, timingSafeEqual } from 'node:crypto'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new HttpError(400, 'Solicitud inválida.')
  }
}

// Envuelve cada función: convierte HttpError en respuesta y oculta los errores internos.
export function handler(methods: string[], fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (!methods.includes(req.method)) return json(405, { error: 'Método no permitido.' })
    try {
      return await fn(req)
    } catch (e) {
      if (e instanceof HttpError) return json(e.status, { error: e.message })
      console.error(e)
      return json(500, { error: 'No se pudo conectar con la base de datos. Intenta de nuevo.' })
    }
  }
}

/* ---- Sesión firmada (sin variables extra: la clave se deriva de DB_PASSWORD) ---- */

export interface Sesion {
  tecId: number
  /** true mientras la contraseña siga siendo 123: solo puede cambiarla. */
  cambio: boolean
  exp: number
}

const HORAS = 12

function secreto(): Buffer {
  return createHash('sha256')
    .update(`servetgranja|${process.env.DB_USERNAME}|${process.env.DB_PASSWORD}`)
    .digest()
}

function firma(datos: string): string {
  return createHmac('sha256', secreto()).update(datos).digest('base64url')
}

export function crearToken(tecId: number, cambio: boolean): string {
  const s: Sesion = { tecId, cambio, exp: Date.now() + HORAS * 3600_000 }
  const datos = Buffer.from(JSON.stringify(s)).toString('base64url')
  return `${datos}.${firma(datos)}`
}

export function leerSesion(req: Request, permitirCambio = false): Sesion {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const [datos, sig] = token.split('.')
  if (!datos || !sig) throw new HttpError(401, 'Tu sesión terminó. Ingresa de nuevo.')
  const esperada = Buffer.from(firma(datos))
  const recibida = Buffer.from(sig)
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    throw new HttpError(401, 'Tu sesión terminó. Ingresa de nuevo.')
  }
  const s = JSON.parse(Buffer.from(datos, 'base64url').toString()) as Sesion
  if (s.exp < Date.now()) throw new HttpError(401, 'Tu sesión terminó. Ingresa de nuevo.')
  if (s.cambio && !permitirCambio) throw new HttpError(403, 'Debes cambiar tu contraseña antes de continuar.')
  return s
}

export function idParam(url: URL, nombre: string): number {
  const n = Number(url.searchParams.get(nombre))
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `Parámetro ${nombre} inválido.`)
  return n
}
