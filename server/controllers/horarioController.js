import { aMinutos } from "../time.js"

const DIAS = new Set(["0", "1", "2", "3", "4", "5", "6"])

function leerHorario(body) {
  const obraId = Number(body.obraId ?? body.obra_id)
  const horaEntrada = String(body.horaEntrada ?? body.hora_entrada ?? "").slice(0, 5)
  const horaSalida = String(body.horaSalida ?? body.hora_salida ?? "").slice(0, 5)
  const dias = Array.isArray(body.diasLaborales)
    ? body.diasLaborales.map(String)
    : String(body.diasLaborales ?? body.dias_laborales ?? "").split(",").filter(Boolean)
  if (!obraId) return { error: "Elige la obra del horario." }
  if (!/^\d{2}:\d{2}$/.test(horaEntrada) || !/^\d{2}:\d{2}$/.test(horaSalida)) {
    return { error: "Indica la hora de entrada y la de salida." }
  }
  if (aMinutos(horaSalida) <= aMinutos(horaEntrada)) {
    return { error: "La salida debe ser después de la entrada." }
  }
  const unicos = [...new Set(dias)].filter((d) => DIAS.has(d))
  if (unicos.length === 0) return { error: "Elige al menos un día laboral." }
  return {
    obraId,
    horaEntrada,
    horaSalida,
    diasLaborales: unicos.sort().join(","),
  }
}

async function tieneMarcaciones(db, horarioId) {
  const fila = await db.prepare(
    "SELECT COUNT(*) AS n FROM asistencia WHERE horario_id = ? AND estado != 'ANULADA'",
  ).get(horarioId)
  return fila.n > 0
}

export function listarHorarios(db) {
  return async (req, res) => {
    const obraId = Number(req.query.obraId || 0)
    const sql = obraId
      ? "SELECT h.*, o.nombre AS obra_nombre FROM horario h JOIN obra o ON o.id = h.obra_id WHERE h.obra_id = ? ORDER BY h.estado DESC, h.id"
      : "SELECT h.*, o.nombre AS obra_nombre FROM horario h JOIN obra o ON o.id = h.obra_id ORDER BY o.nombre, h.estado DESC, h.id"
    const filas = obraId ? await db.prepare(sql).all(obraId) : await db.prepare(sql).all()
    res.json(filas)
  }
}

export function crearHorario(db) {
  return async (req, res) => {
    const datos = leerHorario(req.body)
    if (datos.error) return res.status(400).json({ error: datos.error })
    const obra = await db.prepare("SELECT id FROM obra WHERE id = ?").get(datos.obraId)
    if (!obra) return res.status(404).json({ error: "No encontramos esa obra." })
    const info = await db.prepare(`
      INSERT INTO horario (obra_id, hora_entrada, hora_salida, dias_laborales, estado)
      VALUES (?, ?, ?, ?, 1)
    `).run(datos.obraId, datos.horaEntrada, datos.horaSalida, datos.diasLaborales)
    res.status(201).json(await db.prepare("SELECT * FROM horario WHERE id = ?").get(Number(info.lastInsertRowid)))
  }
}

export function actualizarHorario(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    const actual = await db.prepare("SELECT * FROM horario WHERE id = ?").get(id)
    if (!actual) return res.status(404).json({ error: "No encontramos ese horario." })
    const datos = leerHorario({
      obraId: req.body.obraId ?? actual.obra_id,
      horaEntrada: req.body.horaEntrada ?? actual.hora_entrada,
      horaSalida: req.body.horaSalida ?? actual.hora_salida,
      diasLaborales: req.body.diasLaborales ?? actual.dias_laborales,
    })
    if (datos.error) return res.status(400).json({ error: datos.error })
    let estado = actual.estado
    if (req.body.estado !== undefined) estado = req.body.estado ? 1 : 0
    if (!estado && await tieneMarcaciones(db, id)) {
      return res.status(409).json({
        error: "Este horario ya tiene marcaciones. Puedes ajustarlo, pero no desactivarlo, para no perder el historial.",
      })
    }
    await db.prepare(`
      UPDATE horario
      SET obra_id = ?, hora_entrada = ?, hora_salida = ?, dias_laborales = ?, estado = ?
      WHERE id = ?
    `).run(datos.obraId, datos.horaEntrada, datos.horaSalida, datos.diasLaborales, estado, id)
    res.json(await db.prepare("SELECT * FROM horario WHERE id = ?").get(id))
  }
}
