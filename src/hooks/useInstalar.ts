import { useEffect, useState } from 'react'

interface EventoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// El navegador avisa una sola vez y muy temprano, así que se escucha desde que carga el módulo.
let pendiente: EventoInstalar | null = null
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((f) => f())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  pendiente = e as EventoInstalar
  avisar()
})
window.addEventListener('appinstalled', () => {
  pendiente = null
  avisar()
})

const yaInstalada = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/**
 * modo 'boton': Android y PC (Chrome/Edge) permiten instalar con un clic.
 * modo 'ios': iPhone/iPad solo se instala desde Safari con Compartir → Agregar a inicio.
 * modo null: ya está instalada o el navegador no lo permite.
 */
export function useInstalar() {
  const [, refrescar] = useState(0)
  useEffect(() => {
    const f = () => refrescar((n) => n + 1)
    oyentes.add(f)
    return () => {
      oyentes.delete(f)
    }
  }, [])

  const modo: 'boton' | 'ios' | null = yaInstalada() ? null : pendiente ? 'boton' : esIOS() ? 'ios' : null

  async function instalar() {
    if (!pendiente) return
    await pendiente.prompt()
    await pendiente.userChoice
    pendiente = null
    avisar()
  }

  return { modo, instalar }
}
