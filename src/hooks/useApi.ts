import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/** Carga datos de la API al montar o cuando cambia la ruta. */
export function useApi<T>(ruta: string) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError('')
    api<T>(ruta)
      .then((d) => vigente && setDatos(d))
      .catch((e: Error) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [ruta])

  return { datos, error, cargando }
}
