export interface Tecnico {
  id: number
  nombre: string
  empresa: string
}

export interface Sesion {
  token: string
  debeCambiarClave: boolean
  tecnico: Tecnico
}

/** 0 = solo nueva visita · 1 = + visitas de la fecha anterior · 2 = + todas las visitas */
export type NivelAuth = 0 | 1 | 2

export interface CriaLista {
  EmpId: number
  EmpNombre: string
  GrjNombre: string
  GlpNombre: string
  IdCria: number
  CrFecInicio: string
  NivelAuth: NivelAuth
}

export interface CriaDetalle {
  IdCria: number
  GlpNombre: string
  CrFecInicio: string
  Raza: string
  CrSexo: number
  CrFecIngreso: string
  PerNombre: string
  GrjNombre: string
  EmpNombre: string
  NivelAuth: NivelAuth
}

export interface VisitaAnterior {
  IdVstTec: number
  VstTcDoc: number
  VstTcFec: string
  VstTcTecEmp: string | null
  VstTcTipDif: number
  VstTcChkAli: number
  VstTcChkAgua: number
  VstTcNec: number
  VstTcMstLab: number
  VstTcVacunas: number
  VstTcVacuDet: string | null
  VstTcObs: string | null
  VstTcSitNor: number
  VstTcSitPrbSan: number
  VstTcSitPrbMan: number
  VstTcSitPrbNut: number
  TecNombre: string | null
  recomendaciones: string[]
}

export interface FormVisita {
  doc: string
  fecha: string
  empresa: string
  dif: 0 | 1 | 2
  ali: boolean
  agua: boolean
  nec: boolean
  lab: boolean
  vac: boolean
  vacDet: string
  obs: string
  rec: string
  nor: boolean
  san: boolean
  man: boolean
  nut: boolean
}
