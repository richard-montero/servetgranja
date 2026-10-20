import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, almacen, onSesionExpirada } from '../lib/api'
import type { Sesion } from '../types'

interface AuthCtx {
  sesion: Sesion | null
  ingresar: (celular: string, password: string) => Promise<Sesion>
  cambiarClave: (nueva: string) => Promise<void>
  salir: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => almacen.sesion())

  const guardar = useCallback((s: Sesion | null) => {
    almacen.guardarSesion(s)
    setSesion(s)
  }, [])

  const salir = useCallback(() => guardar(null), [guardar])

  useEffect(() => onSesionExpirada(salir), [salir])

  const ingresar = useCallback(
    async (celular: string, password: string) => {
      const s = await api<Sesion>('login', { method: 'POST', body: { celular, password } })
      almacen.guardarCelular(celular.trim())
      guardar(s)
      return s
    },
    [guardar],
  )

  const cambiarClave = useCallback(
    async (nueva: string) => {
      const { token } = await api<{ token: string }>('cambiar-clave', { method: 'POST', body: { nueva } })
      if (sesion) guardar({ ...sesion, token, debeCambiarClave: false })
    },
    [sesion, guardar],
  )

  return <Ctx.Provider value={{ sesion, ingresar, cambiarClave, salir }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth fuera de AuthProvider')
  return c
}
