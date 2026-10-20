// Cliente de la API. El navegador nunca habla con MySQL: todo pasa por las Netlify Functions en /api.
import type { Sesion } from '../types'

const CLAVE_SESION = 'svg_sesion'
const CLAVE_CELULAR = 'svg_celular'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave)
  } catch {
    return null
  }
}

function escribir(clave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(clave)
    else localStorage.setItem(clave, valor)
  } catch {
    /* almacenamiento no disponible: la app sigue funcionando en memoria */
  }
}

export const almacen = {
  sesion(): Sesion | null {
    const s = leer(CLAVE_SESION)
    try {
      return s ? (JSON.parse(s) as Sesion) : null
    } catch {
      return null
    }
  },
  guardarSesion(s: Sesion | null) {
    escribir(CLAVE_SESION, s ? JSON.stringify(s) : null)
  },
  celular(): string {
    return leer(CLAVE_CELULAR) ?? ''
  },
  guardarCelular(c: string) {
    escribir(CLAVE_CELULAR, c)
  },
}

let alExpirar: () => void = () => {}
export function onSesionExpirada(fn: () => void) {
  alExpirar = fn
}

export async function api<T>(ruta: string, opciones: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = almacen.sesion()?.token
  let res: Response
  try {
    res = await fetch(`/api/${ruta}`, {
      method: opciones.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
    })
  } catch {
    throw new ApiError(0, 'Sin conexión. Revisa tu internet e intenta de nuevo.')
  }
  const datos = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && ruta !== 'login') alExpirar()
    throw new ApiError(res.status, datos.error ?? `Error ${res.status}`)
  }
  return datos as T
}
