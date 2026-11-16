import { partesBogota } from "../time.js"

function leerObra(body) {
  const nombre = String(body.nombre || "").trim()
  const ubicacion = String(body.ubicacion || "").trim()
  const fechaInicio = String(body.fechaInicio || body.fecha_inicio || "").trim()
  if (nombre.length < 3) return { error: "Escribe el nombre de la obra." }
  if (ubicacion.length < 3) return { error: "Escribe la ubicación de la obra." }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)) {
    return { error: "La fecha de inicio debe tener formato año-mes-día." }
  }
  return { nombre, ubicacion, fechaInicio }
}

async function conPersonal(db, obra) {
  const trabajadores = await db.prepare(`
    SELECT u.id, u.nombre, u.documento, u.cargo, u.rol
    FROM obra_trabajador ot
    JOIN usuario u ON u.id = ot.usuario_id
    WHERE ot.obra_id = ?
    ORDER BY u.nombre
  `).all(obra.id)
  const horarios = await db.prepare(
    "SELECT * FROM horario WHERE obra_id = ? ORDER BY estado DESC, id",
  ).all(obra.id)
  return { ...obra, trabajadores, horarios }
}

export function listarObras(db) {
  return async (req, res) => {
    const estado = req.query.estado
    let sql = "SELECT * FROM obra"
    const params = []
    if (estado === "activa") {
      sql += " WHERE estado = 1"
    } else if (estado === "inactiva") {
      sql += " WHERE estado = 0"
    }
    sql += " ORDER BY estado DESC, nombre COLLATE NOCASE"
    const obras = await db.prepare(sql).all(...params)
    res.json(await Promise.all(obras.map((obra) => conPersonal(db, obra))))
  }
}

export function misObras(db) {
  return async (req, res) => {
    const obras = await db.prepare(`
      SELECT o.* FROM obra o
      JOIN obra_trabajador ot ON ot.obra_id = o.id
      WHERE ot.usuario_id = ? AND o.estado = 1
      ORDER BY o.nombre
    `).all(req.usuario.id)
    const hoy = String(req.query.fecha || partesBogota().fecha)
    const resultado = []
    for (const obra of obras) {
      const detalle = await conPersonal(db, obra)
      const marcas = await db.prepare(`
        SELECT * FROM asistencia
        WHERE usuario_id = ? AND obra_id = ? AND fecha = ? AND estado != 'ANULADA'
        ORDER BY hora_registro
      `).all(req.usuario.id, obra.id, hoy || "")
      resultado.push({ ...detalle, marcasHoy: marcas })
    }
    res.json(resultado)
  }
}

export function crearObra(db) {
  return async (req, res) => {
    const datos = leerObra(req.body)
    if (datos.error) return res.status(400).json({ error: datos.error })
    const info = await db.prepare(
      "INSERT INTO obra (nombre, ubicacion, fecha_inicio, estado) VALUES (?, ?, ?, 1)",
    ).run(datos.nombre, datos.ubicacion, datos.fechaInicio)
    const obra = await db.prepare("SELECT * FROM obra WHERE id = ?").get(Number(info.lastInsertRowid))
    res.status(201).json(await conPersonal(db, obra))
  }
}

export function actualizarObra(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    const actual = await db.prepare("SELECT * FROM obra WHERE id = ?").get(id)
    if (!actual) return res.status(404).json({ error: "No encontramos esa obra." })
    const datos = leerObra({
      nombre: req.body.nombre ?? actual.nombre,
      ubicacion: req.body.ubicacion ?? actual.ubicacion,
      fechaInicio: req.body.fechaInicio ?? req.body.fecha_inicio ?? actual.fecha_inicio,
    })
    if (datos.error) return res.status(400).json({ error: datos.error })
    let estado = actual.estado
    if (req.body.estado !== undefined) {
      estado = req.body.estado ? 1 : 0
      if (!estado) {
        const vinculados = (await db.prepare(
          "SELECT COUNT(*) AS n FROM obra_trabajador WHERE obra_id = ?",
        ).get(id)).n
        if (vinculados > 0) {
          return res.status(409).json({
            error: "Quita primero a los trabajadores asignados. Así no se pierde el control de quién labora en la obra.",
          })
        }
      }
    }
    await db.prepare(
      "UPDATE obra SET nombre = ?, ubicacion = ?, fecha_inicio = ?, estado = ? WHERE id = ?",
    ).run(datos.nombre, datos.ubicacion, datos.fechaInicio, estado, id)
    res.json(await conPersonal(db, await db.prepare("SELECT * FROM obra WHERE id = ?").get(id)))
  }
}

export function asignarTrabajadores(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    const obra = await db.prepare("SELECT * FROM obra WHERE id = ?").get(id)
    if (!obra) return res.status(404).json({ error: "No encontramos esa obra." })
    if (!Array.isArray(req.body.trabajadorIds)) {
      return res.status(400).json({ error: "Indica la lista de trabajadores." })
    }
    const ids = [...new Set(req.body.trabajadorIds.map(Number))].filter((n) => Number.isInteger(n) && n > 0)
    const marcar = db.prepare("SELECT id, estado FROM usuario WHERE id = ?")
    for (const usuarioId of ids) {
      const usuario = await marcar.get(usuarioId)
      if (!usuario || !usuario.estado) {
        return res.status(400).json({ error: "Hay una persona que no existe o está desactivada." })
      }
    }
    await db.exec("BEGIN")
    try {
      await db.prepare("DELETE FROM obra_trabajador WHERE obra_id = ?").run(id)
      const insertar = db.prepare("INSERT INTO obra_trabajador (obra_id, usuario_id) VALUES (?, ?)")
      for (const usuarioId of ids) await insertar.run(id, usuarioId)
      await db.exec("COMMIT")
    } catch (error) {
      await db.exec("ROLLBACK")
      throw error
    }
    res.json(await conPersonal(db, obra))
  }
}
