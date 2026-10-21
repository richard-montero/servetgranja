// Informe PDF de la visita técnica. jsPDF se carga solo cuando se genera un informe.
import type { jsPDF as JsPDF } from 'jspdf'
import type { CriaDetalle, FormVisita } from '../types'
import { DIFERENCIAS, fechaCorta, SEXO } from './formato'

type RGB = [number, number, number]
const C = {
  field: [47, 93, 42] as RGB,
  straw: [233, 184, 36] as RGB,
  strawSoft: [251, 241, 207] as RGB,
  strawInk: [74, 58, 0] as RGB,
  ink: [28, 36, 24] as RGB,
  muted: [93, 104, 87] as RGB,
  line: [213, 220, 205] as RGB,
  sunk: [244, 246, 240] as RGB,
  ok: [47, 125, 59] as RGB,
  bad: [179, 50, 42] as RGB,
  white: [255, 255, 255] as RGB,
}

export interface DatosInforme {
  id: number
  cria: CriaDetalle
  f: FormVisita
  tecnico: string
}

/** Días de vida del lote en la fecha de la visita (día 0 = ingreso al galpón). */
export function edadLote(ingreso: string, fecha: string): number | null {
  const d = Math.round((Date.parse(fecha.slice(0, 10)) - Date.parse(ingreso.slice(0, 10))) / 86_400_000)
  return Number.isFinite(d) && d >= 0 ? d : null
}

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Ej.: Informe-VetGranja_La-Esperanza_GRA-23-CAL_dia37_2026-10-21_N4821.pdf */
export function nombreInforme({ id, cria, f }: DatosInforme): string {
  const edad = edadLote(cria.CrFecIngreso, f.fecha)
  return ['Informe-VetGranja', slug(cria.GrjNombre), slug(cria.GlpNombre), edad === null ? '' : `dia${edad}`, f.fecha, `N${id}`]
    .filter(Boolean)
    .join('_') + '.pdf'
}

async function imagen(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob()
    return await new Promise((ok, mal) => {
      const r = new FileReader()
      r.onload = () => ok(r.result as string)
      r.onerror = mal
      r.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** Genera y descarga el informe. Devuelve el nombre del archivo. */
export async function generarInforme(datos: DatosInforme): Promise<string> {
  const doc = await crearInforme(datos)
  const nombre = nombreInforme(datos)
  doc.save(nombre)
  return nombre
}

export async function crearInforme(datos: DatosInforme): Promise<JsPDF> {
  const { jsPDF } = await import('jspdf')
  const [pollo, logo] = await Promise.all([imagen('/pollo.jpg'), imagen('/ramnsoft.png')])
  const { id, cria, f, tecnico } = datos
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 16
  const ancho = W - 2 * M
  const ahora = new Date()
  const emitido = `${fechaCorta(ahora.toISOString())} ${ahora.toTimeString().slice(0, 5)}`

  const fill = (c: RGB) => doc.setFillColor(...c)
  const draw = (c: RGB) => doc.setDrawColor(...c)
  const color = (c: RGB) => doc.setTextColor(...c)
  const fuente = (estilo: 'normal' | 'bold', tam: number) => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tam)
  }

  /* ---------- Encabezado ---------- */
  fill(C.field)
  doc.rect(0, 0, W, 40, 'F')
  fill(C.straw)
  doc.rect(0, 40, W, 1.6, 'F')
  if (pollo) {
    doc.saveGraphicsState()
    doc.circle(M + 12, 20, 12, null)
    doc.clip()
    doc.discardPath()
    doc.addImage(pollo, 'JPEG', M, 8, 24, 24)
    doc.restoreGraphicsState()
    draw(C.straw)
    doc.setLineWidth(1.2)
    doc.circle(M + 12, 20, 12, 'S')
  }
  color(C.white)
  fuente('bold', 19)
  doc.text('Informe de Visita Técnica', M + 30, 17)
  fuente('normal', 10)
  doc.text('Servicios Veterinarios en Granja · Pollos de engorde', M + 30, 24)
  fuente('normal', 8.5)
  doc.text(`Emitido el ${emitido}`, M + 30, 30)

  fuente('bold', 18)
  doc.text(`N.º ${id}`, W - M, 17, { align: 'right' })
  fill(C.straw)
  doc.roundedRect(W - M - 30, 22, 30, 7.5, 3.7, 3.7, 'F')
  color(C.strawInk)
  fuente('bold', 8.5)
  doc.text('APROBADA', W - M - 15, 27.1, { align: 'center' })

  /* ---------- Franja de ubicación ---------- */
  let y = 47
  fill(C.strawSoft)
  doc.roundedRect(M, y, ancho, 11, 2, 2, 'F')
  color(C.strawInk)
  fuente('bold', 11)
  doc.text(`${cria.EmpNombre}  ·  Granja ${cria.GrjNombre}  ·  Galpón ${cria.GlpNombre}`, M + 4, y + 7.2, {
    maxWidth: ancho - 8,
  })
  y += 17

  /* ---------- Indicadores ---------- */
  const edad = edadLote(cria.CrFecIngreso, f.fecha)
  const tiles: [string, string][] = [
    ['Fecha de visita', fechaCorta(f.fecha)],
    ['Edad del lote', edad === null ? '-' : `${edad} días`],
    ['Raza', cria.Raza],
    ['Sexo', SEXO[cria.CrSexo] ?? '-'],
  ]
  const gap = 4
  const tw = (ancho - gap * 3) / 4
  tiles.forEach(([k, v], i) => {
    const x = M + i * (tw + gap)
    draw(C.line)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, tw, 16, 2, 2, 'S')
    color(C.muted)
    fuente('bold', 7)
    doc.text(k.toUpperCase(), x + 3.5, y + 5.6)
    color(C.ink)
    fuente('bold', 11.5)
    doc.text(doc.splitTextToSize(v, tw - 7)[0], x + 3.5, y + 12.2)
  })
  y += 23

  /* ---------- Utilidades de sección ---------- */
  const espacio = (alto: number) => {
    if (y + alto > 262) {
      doc.addPage()
      y = 20
    }
  }
  const seccion = (titulo: string) => {
    espacio(16)
    color(C.field)
    fuente('bold', 10.5)
    doc.text(titulo.toUpperCase(), M, y)
    draw(C.line)
    doc.setLineWidth(0.3)
    doc.line(M + doc.getTextWidth(titulo.toUpperCase()) + 3, y - 1.2, W - M, y - 1.2)
    y += 6
  }
  // Datos en una fila de tres columnas (etiqueta pequeña, valor en negrita).
  const fila = (items: [string, string][]) => {
    const col = ancho / items.length
    items.forEach(([k, v], i) => {
      const x = M + i * col
      color(C.muted)
      fuente('normal', 7.5)
      doc.text(k, x, y)
      color(C.ink)
      fuente('bold', 10)
      doc.text(doc.splitTextToSize(v || '-', col - 5)[0], x, y + 5)
    })
    y += 13
  }
  const chip = (texto: string, x: number, fondo: RGB, tinta: RGB) => {
    fuente('bold', 8)
    const w = doc.getTextWidth(texto) + 7
    fill(fondo)
    doc.roundedRect(x, y - 4.6, w, 6.6, 3.3, 3.3, 'F')
    color(tinta)
    doc.text(texto, x + 3.5, y)
    return x + w + 3
  }
  const casilla = (texto: string, marcada: boolean, x: number, yy: number) => {
    draw(marcada ? C.field : C.line)
    doc.setLineWidth(0.4)
    if (marcada) {
      fill(C.field)
      doc.roundedRect(x, yy - 3.6, 4.4, 4.4, 0.8, 0.8, 'FD')
      draw(C.white)
      doc.setLineWidth(0.6)
      doc.line(x + 0.9, yy - 1.4, x + 1.9, yy - 0.3)
      doc.line(x + 1.9, yy - 0.3, x + 3.6, yy - 2.8)
    } else {
      doc.roundedRect(x, yy - 3.6, 4.4, 4.4, 0.8, 0.8, 'S')
    }
    color(marcada ? C.ink : C.muted)
    fuente(marcada ? 'bold' : 'normal', 9.5)
    doc.text(texto, x + 6.5, yy)
  }
  const caja = (texto: string, vacio: string, fondo: RGB, tinta: RGB) => {
    fuente('normal', 10)
    const lineas = doc.splitTextToSize(texto || vacio, ancho - 10) as string[]
    const alto = lineas.length * 4.5 + 7
    espacio(alto + 4)
    fill(fondo)
    doc.roundedRect(M, y - 1, ancho, alto, 2, 2, 'F')
    color(texto ? tinta : C.muted)
    if (!texto) doc.setFont('helvetica', 'italic')
    doc.setLineHeightFactor(1.3)
    doc.text(lineas, M + 5, y + 4.6)
    y += alto + 5
  }

  /* ---------- Contenido ---------- */
  seccion('Datos del lote')
  fila([
    ['Encargado del galpón', cria.PerNombre],
    ['Ingreso de las aves', fechaCorta(cria.CrFecIngreso)],
    ['Inicio de la cría', fechaCorta(cria.CrFecInicio)],
  ])

  seccion('Visitante')
  fila([
    ['Médico veterinario', tecnico],
    ['Empresa del técnico', f.empresa],
    ['Documento', f.doc.trim() || '0'],
  ])

  seccion('Evaluación en campo')
  espacio(30)
  color(C.muted)
  fuente('normal', 7.5)
  doc.text('Diferencias respecto al estándar', M, y)
  y += 6
  const difColor: RGB[] = [C.ok, C.bad, C.muted]
  chip(DIFERENCIAS[f.dif].toUpperCase(), M, difColor[f.dif], C.white)
  y += 8
  const items: [string, boolean][] = [
    ['Chequeo de alimento', f.ali],
    ['Chequeo de agua de bebida', f.agua],
    ['Necropsia', f.nec],
    ['Muestra para laboratorio', f.lab],
  ]
  items.forEach(([t, v], i) => casilla(t, v, M + (i % 2) * (ancho / 2), y + Math.floor(i / 2) * 7))
  y += 14
  casilla(f.vac ? `Vacunación: ${f.vacDet}` : 'Vacunación', f.vac, M, y)
  y += 11

  seccion('Situación del lote')
  espacio(10)
  if (f.nor) {
    chip('SITUACIÓN NORMAL', M, C.ok, C.white)
  } else {
    let x = M
    if (f.san) x = chip('PROBLEMA SANITARIO', x, C.bad, C.white)
    if (f.man) x = chip('PROBLEMA DE MANEJO', x, C.bad, C.white)
    if (f.nut) chip('PROBLEMA NUTRICIONAL', x, C.bad, C.white)
  }
  y += 11

  seccion('Diagnóstico')
  caja(f.obs.trim(), 'Sin observaciones registradas.', C.sunk, C.ink)

  seccion('Recomendaciones')
  caja(f.rec.trim(), 'Sin recomendaciones para esta visita.', C.strawSoft, C.strawInk)

  /* ---------- Firma ---------- */
  if (y + 18 > 276) {
    doc.addPage()
    y = 30
  }
  y = Math.max(y + 8, 246)
  draw(C.ink)
  doc.setLineWidth(0.3)
  doc.line(W - M - 70, y, W - M, y)
  color(C.ink)
  fuente('bold', 10)
  doc.text(tecnico, W - M - 35, y + 5, { align: 'center' })
  color(C.muted)
  fuente('normal', 8)
  doc.text('Médico Veterinario · Firma y sello', W - M - 35, y + 9.5, { align: 'center' })

  /* ---------- Pie en todas las páginas ---------- */
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    pie(doc, p, paginas, logo, M, W)
  }
  return doc
}

function pie(doc: JsPDF, p: number, total: number, logo: string | null, M: number, W: number) {
  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.3)
  doc.line(M, 280, W - M, 280)
  if (logo) doc.addImage(logo, 'PNG', M, 282.5, 6, 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.muted)
  doc.text('Generado con SerVetGranja · Desarrollado por RAMN Software', M + (logo ? 8 : 0), 286.4)
  doc.text(`Página ${p} de ${total}`, W - M, 286.4, { align: 'right' })
}
