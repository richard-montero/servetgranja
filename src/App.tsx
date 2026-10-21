import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './routes/ProtectedRoute'
import Login from './pages/Login'
import CambiarClave from './pages/CambiarClave'
import Crias from './pages/Crias'
import NuevaVisita from './pages/NuevaVisita'
import VisitasAnteriores from './pages/VisitasAnteriores'
import VisitasEnRevision from './pages/VisitasEnRevision'
import EditarVisita from './pages/EditarVisita'
import NoEncontrada from './pages/NoEncontrada'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/crias" replace />} />
            <Route path="/cambiar-clave" element={<CambiarClave />} />
            <Route path="/crias" element={<Crias />} />
            <Route path="/visita/:idCria" element={<NuevaVisita />} />
            <Route path="/visita/:idCria/anteriores" element={<VisitasAnteriores />} />
            <Route path="/visita/:idCria/revision" element={<VisitasEnRevision />} />
            <Route path="/visita/:idCria/revision/:idVisita" element={<EditarVisita />} />
          </Route>
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
