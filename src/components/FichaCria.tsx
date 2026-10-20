import { fechaCorta, SEXO } from '../lib/formato'
import type { CriaDetalle } from '../types'

export function FichaCria({ cria }: { cria: CriaDetalle }) {
  return (
    <div className="ficha">
      <div className="wide">
        <div className="k">Galpón</div>
        <div className="v">{cria.GlpNombre}</div>
      </div>
      <div>
        <div className="k">Raza</div>
        <div className="v">{cria.Raza}</div>
      </div>
      <div>
        <div className="k">Sexo</div>
        <div className="v">{SEXO[cria.CrSexo] ?? '—'}</div>
      </div>
      <div>
        <div className="k">Ingreso</div>
        <div className="v">{fechaCorta(cria.CrFecIngreso)}</div>
      </div>
      <div className="wide">
        <div className="k">Encargado</div>
        <div className="v">{cria.PerNombre}</div>
      </div>
    </div>
  )
}
