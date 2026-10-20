/** "2026-03-14" o "2026-03-14 00:00:00" → "14/03/2026" */
export function fechaCorta(s: string | null | undefined): string {
  if (!s) return ''
  const [y, m, d] = s.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

/** Fecha local de hoy en formato YYYY-MM-DD. */
export function hoyISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export const SEXO = ['Mixto', 'Macho', 'Hembra']
export const DIFERENCIAS = ['Positivas', 'Negativas', 'Normales']
export const NIVEL_ETIQUETA = ['Solo nueva', '+ fecha anterior', '+ todas']
