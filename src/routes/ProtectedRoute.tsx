import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/** Exige sesión. Si la contraseña sigue siendo 123, solo deja entrar a /cambiar-clave. */
export function ProtectedRoute() {
  const { sesion } = useAuth()
  const { pathname } = useLocation()
  if (!sesion) return <Navigate to="/login" replace />
  if (sesion.debeCambiarClave && pathname !== '/cambiar-clave') return <Navigate to="/cambiar-clave" replace />
  if (!sesion.debeCambiarClave && pathname === '/cambiar-clave') return <Navigate to="/crias" replace />
  return <Outlet />
}
