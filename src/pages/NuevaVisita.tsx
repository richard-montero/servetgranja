import { useNavigate, useParams } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { EditorVisita } from '../components/EditorVisita'
import { Cargando, MensajeError } from '../components/Estado'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { hoyISO } from '../lib/formato'
import type { CriaDetalle, FormVisita } from '../types'

export default function NuevaVisita() {
  const { idCria } = useParams()
  const navigate = useNavigate()
  const { sesion } = useAuth()
  const { datos: cria, error, cargando } = useApi<CriaDetalle>(`cria?id=${idCria}`)

  if (!cria) {
    return (
      <div className="app">
        <AppBar titulo="Nueva visita" volver="/crias" />
        <main className="screen">
          {cargando && <Cargando />}
          {error && <MensajeError texto={error} />}
        </main>
      </div>
    )
  }

  const inicial: FormVisita = {
    doc: '', fecha: hoyISO(), empresa: sesion?.tecnico.empresa ?? '', dif: 2,
    ali: false, agua: false, nec: false, lab: false, vac: false, vacDet: '',
    obs: '', rec: '', nor: true, san: false, man: false, nut: false,
  }

  return (
    <EditorVisita
      cria={cria}
      inicial={inicial}
      titulo="Nueva visita"
      volver="/crias"
      encabezado={
        cria.NivelAuth > 0 && (
          <button className="btn ghost" onClick={() => navigate(`/visita/${cria.IdCria}/anteriores`)}>
            Ver {cria.NivelAuth === 1 ? 'visitas de la fecha anterior' : 'todas las visitas'}
          </button>
        )
      }
      onGuardar={async (f, pdf) => {
        const { id } = await api<{ id: number }>('visitas', { method: 'POST', body: { ...f, pdf, idCria: cria.IdCria } })
        return id
      }}
    />
  )
}
