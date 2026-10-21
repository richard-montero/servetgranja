import { Link } from 'react-router-dom'
import { AppBar } from '../components/AppBar'

export default function NoEncontrada() {
  return (
    <div className="app angosta">
      <AppBar titulo="Página no encontrada" />
      <main className="screen">
        <p>Esta dirección no existe en SerVetGranja.</p>
        <Link className="btn" to="/crias">Ir a mis crías</Link>
      </main>
    </div>
  )
}
