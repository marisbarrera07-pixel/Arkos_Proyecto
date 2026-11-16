import sql from "mssql"
import bcrypt from "bcryptjs"
import { partesBogota } from "./time.js"

const IDENTITY_INSERT = /INSERT\s+INTO\s+(usuario|obra|horario|asistencia|auditoria|solicitud_ajuste)\b/i

const SCHEMA = `
IF OBJECT_ID(N'dbo.usuario', N'U') IS NULL
CREATE TABLE dbo.usuario (
  id INT IDENTITY(1,1) PRIMARY KEY,
  documento NVARCHAR(20) NOT NULL UNIQUE,
  nombre NVARCHAR(120) NOT NULL,
  correo NVARCHAR(120),
  telefono NVARCHAR(30),
  cargo NVARCHAR(80),
  contrasena_hash NVARCHAR(120) NOT NULL,
  rol NVARCHAR(20) NOT NULL CHECK (rol IN ('ADMINISTRADOR','TRABAJADOR')),
  estado INT NOT NULL DEFAULT 1,
  creado_en NVARCHAR(32) NOT NULL
);

IF OBJECT_ID(N'dbo.obra', N'U') IS NULL
CREATE TABLE dbo.obra (
  id INT IDENTITY(1,1) PRIMARY KEY,
  nombre NVARCHAR(160) NOT NULL,
  ubicacion NVARCHAR(200) NOT NULL,
  fecha_inicio NVARCHAR(10) NOT NULL,
  estado INT NOT NULL DEFAULT 1
);

IF OBJECT_ID(N'dbo.obra_trabajador', N'U') IS NULL
CREATE TABLE dbo.obra_trabajador (
  obra_id INT NOT NULL REFERENCES dbo.obra(id),
  usuario_id INT NOT NULL REFERENCES dbo.usuario(id),
  PRIMARY KEY (obra_id, usuario_id)
);

IF OBJECT_ID(N'dbo.horario', N'U') IS NULL
CREATE TABLE dbo.horario (
  id INT IDENTITY(1,1) PRIMARY KEY,
  obra_id INT NOT NULL REFERENCES dbo.obra(id),
  hora_entrada NVARCHAR(8) NOT NULL,
  hora_salida NVARCHAR(8) NOT NULL,
  dias_laborales NVARCHAR(20) NOT NULL,
  estado INT NOT NULL DEFAULT 1
);

IF OBJECT_ID(N'dbo.asistencia', N'U') IS NULL
CREATE TABLE dbo.asistencia (
  id INT IDENTITY(1,1) PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES dbo.usuario(id),
  obra_id INT NOT NULL REFERENCES dbo.obra(id),
  horario_id INT NULL REFERENCES dbo.horario(id),
  fecha NVARCHAR(10) NOT NULL,
  hora_registro NVARCHAR(8) NOT NULL,
  tipo NVARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA','SALIDA')),
  ubicacion_gps NVARCHAR(80),
  estado_horario NVARCHAR(30) NOT NULL,
  estado NVARCHAR(20) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA','ANULADA','CORREGIDA')),
  creado_en NVARCHAR(32) NOT NULL
);

IF OBJECT_ID(N'dbo.auditoria', N'U') IS NULL
CREATE TABLE dbo.auditoria (
  id INT IDENTITY(1,1) PRIMARY KEY,
  asistencia_id INT NOT NULL REFERENCES dbo.asistencia(id),
  responsable_id INT NOT NULL REFERENCES dbo.usuario(id),
  accion NVARCHAR(30) NOT NULL,
  motivo NVARCHAR(400) NOT NULL,
  fecha NVARCHAR(32) NOT NULL,
  detalle NVARCHAR(400)
);

IF OBJECT_ID(N'dbo.solicitud_ajuste', N'U') IS NULL
CREATE TABLE dbo.solicitud_ajuste (
  id INT IDENTITY(1,1) PRIMARY KEY,
  asistencia_id INT NOT NULL REFERENCES dbo.asistencia(id),
  solicitante_id INT NOT NULL REFERENCES dbo.usuario(id),
  fecha_propuesta NVARCHAR(10) NOT NULL,
  hora_propuesta NVARCHAR(8) NOT NULL,
  motivo NVARCHAR(400) NOT NULL,
  estado NVARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
  resuelto_por INT NULL,
  resuelto_en NVARCHAR(32) NULL
);
`

export function configDesdeEnv(env = process.env) {
  const crudo = env.DB_SERVER || "localhost\\SQLEXPRESS"
  const partes = crudo.split("\\")
  const esLocal = /^(localhost|127\.0\.0\.1)$/i.test(partes[0])
  const options = {
    // En la nube (Azure SQL / Render) casi siempre hace falta encrypt=true
    encrypt: env.DB_ENCRYPT != null ? env.DB_ENCRYPT === "true" : !esLocal,
    trustServerCertificate: env.DB_TRUST_CERT != null ? env.DB_TRUST_CERT !== "false" : esLocal,
    enableArithAbort: true,
  }
  const cfg = {
    server: partes[0],
    database: env.DB_NAME || "Arkos",
    user: env.DB_USER || "arkos",
    password: env.DB_PASSWORD || "",
    connectionTimeout: Number(env.DB_CONNECTION_TIMEOUT) || 30000,
    requestTimeout: Number(env.DB_REQUEST_TIMEOUT) || 30000,
    options,
  }
  if (env.DB_PORT) {
    cfg.port = Number(env.DB_PORT)
  } else if (partes.length > 1) {
    options.instanceName = partes.slice(1).join("\\")
  }
  return cfg
}

function traducirSql(sqlText, paraInsert) {
  let text = sqlText.replace(/COLLATE NOCASE/gi, "")
  let swapLimitOffset = false
  if (/LIMIT \? OFFSET \?/i.test(text)) {
    text = text.replace(/LIMIT \? OFFSET \?/i, "OFFSET ? ROWS FETCH NEXT ? ROWS ONLY")
    swapLimitOffset = true
  }
  if (paraInsert && IDENTITY_INSERT.test(text) && !/OUTPUT/i.test(text)) {
    text = text.replace(/\)\s*VALUES/i, ") OUTPUT INSERTED.id VALUES")
  }
  return { text, swapLimitOffset }
}

function parametrizar(sqlText) {
  let i = 0
  const text = sqlText.replace(/\?/g, () => `@p${i++}`)
  return { text, count: i }
}

export class SqlDb {
  constructor(pool) {
    this.pool = pool
    this.tx = null
  }

  request() {
    return this.tx ? new sql.Request(this.tx) : this.pool.request()
  }

  async query(sqlText, params = [], { insert = false } = {}) {
    const traducido = traducirSql(sqlText, insert)
    let args = [...params]
    if (traducido.swapLimitOffset && args.length >= 2) {
      const offset = args.at(-1)
      const limit = args.at(-2)
      args = [...args.slice(0, -2), offset, limit]
    }
    const { text, count } = parametrizar(traducido.text)
    const req = this.request()
    for (let i = 0; i < count; i += 1) {
      req.input(`p${i}`, args[i] === undefined ? null : args[i])
    }
    try {
      const result = await req.query(text)
      return result.recordset || []
    } catch (error) {
      if (error.number === 2627 || error.number === 2601) {
        const unico = new Error(`UNIQUE ${error.message}`)
        unico.number = error.number
        throw unico
      }
      throw error
    }
  }

  prepare(sqlText) {
    const db = this
    return {
      get: async (...params) => (await db.query(sqlText, params))[0],
      all: async (...params) => db.query(sqlText, params),
      run: async (...params) => {
        const rows = await db.query(sqlText, params, { insert: true })
        return { lastInsertRowid: rows[0]?.id }
      },
    }
  }

  async exec(sqlText) {
    const comando = String(sqlText).trim().toUpperCase()
    if (comando === "BEGIN") {
      this.tx = new sql.Transaction(this.pool)
      await this.tx.begin()
      return
    }
    if (comando === "COMMIT") {
      await this.tx.commit()
      this.tx = null
      return
    }
    if (comando === "ROLLBACK") {
      try {
        await this.tx.rollback()
      } finally {
        this.tx = null
      }
      return
    }
    for (const lote of sqlText.split(";").map((s) => s.trim()).filter(Boolean)) {
      await this.query(lote, [])
    }
  }

  async close() {
    await this.pool.close()
  }
}

async function conectar(cfg) {
  try {
    return await new sql.ConnectionPool(cfg).connect()
  } catch (error) {
    throw new Error(
      `No se pudo conectar con SQL Server (${cfg.server}/${cfg.database}). Revisa DB_SERVER, usuario, contraseña y firewall. ${error.message}`,
    )
  }
}

async function sembrar(db) {
  const hay = await db.prepare("SELECT COUNT(*) AS n FROM usuario").get()
  if (hay?.n > 0) return
  const ahora = partesBogota()
  const ins = db.prepare(`
    INSERT INTO usuario (documento, nombre, correo, telefono, cargo, contrasena_hash, rol, estado, creado_en)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `)
  await ins.run(
    "10000001",
    "Ana Ríos",
    "ana.rios@acm.local",
    "3000000001",
    "Residente de obra",
    bcrypt.hashSync("Admin123*", 10),
    "ADMINISTRADOR",
    `${ahora.fecha} ${ahora.hora}`,
  )
  const trabajador = await ins.run(
    "10000002",
    "Luis Cárdenas",
    "luis.cardenas@acm.local",
    "3000000002",
    "Oficial de construcción",
    bcrypt.hashSync("Obra123*", 10),
    "TRABAJADOR",
    `${ahora.fecha} ${ahora.hora}`,
  )
  const obra = await db.prepare(
    "INSERT INTO obra (nombre, ubicacion, fecha_inicio, estado) VALUES (?, ?, ?, 1)",
  ).run("Torres del Río", "Cra 70 # 1-10, Laureles, Medellín", ahora.fecha)
  await db.prepare("INSERT INTO obra_trabajador (obra_id, usuario_id) VALUES (?, ?)").run(
    Number(obra.lastInsertRowid),
    Number(trabajador.lastInsertRowid),
  )
  await db.prepare(`
    INSERT INTO horario (obra_id, hora_entrada, hora_salida, dias_laborales, estado)
    VALUES (?, '07:00', '17:00', '1,2,3,4,5', 1)
  `).run(Number(obra.lastInsertRowid))
}

export async function openDb(env = process.env) {
  const cfg = configDesdeEnv(env)
  if (!cfg.password) {
    throw new Error("Falta DB_PASSWORD. Configúralo en .env o en las variables de entorno de Render.")
  }

  // En local se intenta crear la base. En Azure SQL / la nube suele fallar (normal):
  // la base ya debe existir y se conecta directo.
  if (env.DB_SKIP_CREATE !== "true") {
    try {
      const master = await conectar({ ...cfg, database: "master" })
      try {
        const nombre = String(cfg.database).replaceAll("]", "")
        await master.request().query(`IF DB_ID(N'${nombre}') IS NULL CREATE DATABASE [${nombre}]`)
      } finally {
        await master.close()
      }
    } catch (error) {
      console.warn(
        `No se pudo preparar la base desde master (normal en Azure SQL). Se conectará a ${cfg.database}. ${error.message}`,
      )
    }
  }

  const pool = await conectar(cfg)
  const db = new SqlDb(pool)
  await db.exec(SCHEMA)
  await sembrar(db)
  return db
}

export async function borrarBase(nombre, env = process.env) {
  const cfg = configDesdeEnv(env)
  const master = await conectar({ ...cfg, database: "master" })
  try {
    const limpio = String(nombre).replaceAll("]", "")
    await master.request().query(`
      IF DB_ID(N'${limpio}') IS NOT NULL
      BEGIN
        ALTER DATABASE [${limpio}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE [${limpio}];
      END
    `)
  } finally {
    await master.close()
  }
}

export function publico(usuario) {
  if (!usuario) return null
  const { contrasena_hash, ...resto } = usuario
  return resto
}
