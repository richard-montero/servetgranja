import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

// Un pool pequeño que se reutiliza mientras la función siga "caliente".
export function getPool(): mysql.Pool {
  if (pool) return pool
  const { DB_NUBE, DB_DATABASE, DB_USERNAME, DB_PASSWORD } = process.env
  if (!DB_NUBE || !DB_DATABASE || !DB_USERNAME || DB_PASSWORD === undefined) {
    throw new Error('Faltan variables DB_* en Netlify')
  }
  const [host, port] = DB_NUBE.split(':')
  pool = mysql.createPool({
    host,
    port: port ? Number(port) : 3306,
    database: DB_DATABASE,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    connectionLimit: 2,
    connectTimeout: 10000,
    dateStrings: true,
  })
  return pool
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().query(sql, params)
  return rows as T[]
}

export interface CriaAuth {
  NivelAuth: number
  CrFecInicio: string
}

// Confirma que la cría está activa (CrEstado = 0) y autorizada al técnico.
export async function autorizacionCria(tecId: number, criaId: number): Promise<CriaAuth | null> {
  const rows = await query<CriaAuth>(
    `SELECT TecCriaAuth.NivelAuth, AVEnG_Cria.CrFecInicio
       FROM TecCriaAuth
       INNER JOIN AVEnG_Cria ON AVEnG_Cria.IdCria = TecCriaAuth.CriaId
      WHERE TecCriaAuth.TecId = ? AND TecCriaAuth.CriaId = ? AND AVEnG_Cria.CrEstado = 0
      LIMIT 1`,
    [tecId, criaId],
  )
  return rows[0] ?? null
}
