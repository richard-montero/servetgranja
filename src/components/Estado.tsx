export function Cargando() {
  return <p className="hint centro">Cargando…</p>
}

export function MensajeError({ texto }: { texto: string }) {
  return <div className="err">{texto}</div>
}
