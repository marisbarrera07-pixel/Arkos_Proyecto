import bcrypt from "bcryptjs"
import { publico } from "../db.js"
import { partesBogota } from "../time.js"

function leerUsuario(body, { exigirClave }) {
  const documento = String(body.documento || "").trim()
  const nombre = String(body.nombre || "").trim()
  const correo = String(body.correo || "").trim()
  const telefono = String(body.telefono || "").trim()
  const cargo = String(body.cargo || "").trim()
  const contrasena = String(body.contrasena || "")
  const rol = body.rol === "ADMINISTRADOR" ? "ADMINISTRADOR" : "TRABAJADOR"
  if (!/^\d{5,15}$/.test(documento)) {
    return { error: "El documento debe tener entre 5 y 15 números." }
  }
  if (nombre.length < 3) return { error: "Escribe el nombre completo del trabajador." }
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { error: "El correo no parece válido." }
  }
  if (exigirClave && contrasena.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." }
  }
  if (!exigirClave && contrasena && contrasena.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." }
  }
  return { documento, nombre, correo, telefono, cargo, contrasena, rol }
}

export function listarUsuarios(db) {
  return async (req, res) => {
    const q = `%${String(req.query.q || "").trim()}%`
    const page = Math.max(1, Number(req.query.page) || 1)
    const size = 8
    const incluir = req.query.incluirInactivos === "1"
    const estadoSql = incluir ? "1=1" : "estado = 1"
    const where = `${estadoSql} AND (nombre LIKE ? OR documento LIKE ?)`
    const total = (await db.prepare(`SELECT COUNT(*) AS n FROM usuario WHERE ${where}`).get(q, q)).n
    if (req.query.page === "todas") {
      const filas = await db.prepare(`
        SELECT * FROM usuario WHERE ${where}
        ORDER BY nombre COLLATE NOCASE
      `).all(q, q)
      return res.json({ total, page: 1, filas: filas.map(publico) })
    }
    const filas = await db.prepare(`
      SELECT * FROM usuario WHERE ${where}
      ORDER BY nombre COLLATE NOCASE
      LIMIT ? OFFSET ?
    `).all(q, q, size, (page - 1) * size)
    res.json({ total, page, filas: filas.map(publico) })
  }
}

export function crearUsuario(db) {
  return async (req, res) => {
    const datos = leerUsuario(req.body, { exigirClave: true })
    if (datos.error) return res.status(400).json({ error: datos.error })
    const ahora = partesBogota()
    try {
      const info = await db.prepare(`
        INSERT INTO usuario (documento, nombre, correo, telefono, cargo, contrasena_hash, rol, estado, creado_en)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        datos.documento,
        datos.nombre,
        datos.correo,
        datos.telefono,
        datos.cargo,
        bcrypt.hashSync(datos.contrasena, 10),
        datos.rol,
        `${ahora.fecha} ${ahora.hora}`,
      )
      const usuario = await db.prepare("SELECT * FROM usuario WHERE id = ?").get(Number(info.lastInsertRowid))
      res.status(201).json(publico(usuario))
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        return res.status(409).json({ error: "Ya existe un trabajador con ese documento." })
      }
      throw error
    }
  }
}

export function actualizarUsuario(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    const actual = await db.prepare("SELECT * FROM usuario WHERE id = ?").get(id)
    if (!actual) return res.status(404).json({ error: "No encontramos ese trabajador." })
    const datos = leerUsuario({ ...actual, ...req.body, contrasena: req.body.contrasena || "" }, { exigirClave: false })
    if (datos.error) return res.status(400).json({ error: datos.error })
    if (actual.rol === "ADMINISTRADOR" && datos.rol !== "ADMINISTRADOR") {
      const otros = (await db.prepare(
        "SELECT COUNT(*) AS n FROM usuario WHERE rol = 'ADMINISTRADOR' AND estado = 1 AND id != ?",
      ).get(id)).n
      if (otros === 0) {
        return res.status(409).json({ error: "Debe quedar al menos un administrador activo." })
      }
    }
    const hash = datos.contrasena ? bcrypt.hashSync(datos.contrasena, 10) : actual.contrasena_hash
    try {
      await db.prepare(`
        UPDATE usuario
        SET documento = ?, nombre = ?, correo = ?, telefono = ?, cargo = ?, contrasena_hash = ?, rol = ?
        WHERE id = ?
      `).run(datos.documento, datos.nombre, datos.correo, datos.telefono, datos.cargo, hash, datos.rol, id)
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        return res.status(409).json({ error: "Ya existe un trabajador con ese documento." })
      }
      throw error
    }
    res.json(publico(await db.prepare("SELECT * FROM usuario WHERE id = ?").get(id)))
  }
}

export function desactivarUsuario(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    if (id === req.usuario.id) {
      return res.status(409).json({ error: "No puedes desactivar tu propio usuario." })
    }
    const actual = await db.prepare("SELECT * FROM usuario WHERE id = ?").get(id)
    if (!actual) return res.status(404).json({ error: "No encontramos ese trabajador." })
    if (actual.rol === "ADMINISTRADOR" && actual.estado) {
      const otros = (await db.prepare(
        "SELECT COUNT(*) AS n FROM usuario WHERE rol = 'ADMINISTRADOR' AND estado = 1 AND id != ?",
      ).get(id)).n
      if (otros === 0) {
        return res.status(409).json({ error: "Debe quedar al menos un administrador activo." })
      }
    }
    await db.prepare("UPDATE usuario SET estado = 0 WHERE id = ?").run(id)
    res.json({ ok: true })
  }
}

export function cambiarRol(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    const rol = req.body.rol === "ADMINISTRADOR" ? "ADMINISTRADOR" : "TRABAJADOR"
    const actual = await db.prepare("SELECT * FROM usuario WHERE id = ?").get(id)
    if (!actual) return res.status(404).json({ error: "No encontramos ese trabajador." })
    if (actual.rol === "ADMINISTRADOR" && rol !== "ADMINISTRADOR") {
      const otros = (await db.prepare(
        "SELECT COUNT(*) AS n FROM usuario WHERE rol = 'ADMINISTRADOR' AND estado = 1 AND id != ?",
      ).get(id)).n
      if (otros === 0) {
        return res.status(409).json({ error: "Debe quedar al menos un administrador activo." })
      }
    }
    await db.prepare("UPDATE usuario SET rol = ? WHERE id = ?").run(rol, id)
    res.json(publico(await db.prepare("SELECT * FROM usuario WHERE id = ?").get(id)))
  }
}
