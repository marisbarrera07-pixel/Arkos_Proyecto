import { aMinutos, partesBogota } from "../time.js"
import { validarHorario } from "../services/horarioService.js"

function momento(body) {
  if (!body.offline) return partesBogota()
  const cruda = new Date(body.fechaHora)
  if (Number.isNaN(cruda.getTime())) {
    return { error: "La hora guardada sin conexión no es válida." }
  }
  const diff = Date.now() - cruda.getTime()
  if (diff < -2 * 60 * 1000 || diff > 14 * 24 * 60 * 60 * 1000) {
    return { error: "La marcación sin conexión está fuera del tiempo permitido." }
  }
  return partesBogota(cruda)
}

async function registrarAuditoria(db, { asistenciaId, responsableId, accion, motivo, detalle }) {
  const ahora = partesBogota()
  await db.prepare(`
    INSERT INTO auditoria (asistencia_id, responsable_id, accion, motivo, fecha, detalle)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(asistenciaId, responsableId, accion, motivo, `${ahora.fecha} ${ahora.hora}`, detalle || "")
}

async function filaReporte(db, where, params) {
  return db.prepare(`
    SELECT a.*, u.nombre AS trabajador, u.documento, o.nombre AS obra
    FROM asistencia a
    JOIN usuario u ON u.id = a.usuario_id
    JOIN obra o ON o.id = a.obra_id
    ${where}
    ORDER BY a.fecha DESC, a.hora_registro DESC
  `).all(...params)
}

export function registrar(db) {
  return async (req, res) => {
    const obraId = Number(req.body.obraId)
    const tipo = req.body.tipo === "SALIDA" ? "SALIDA" : req.body.tipo === "ENTRADA" ? "ENTRADA" : ""
    if (!obraId || !tipo) {
      return res.status(400).json({ error: "Elige la obra y si es entrada o salida." })
    }
    const obra = await db.prepare("SELECT * FROM obra WHERE id = ? AND estado = 1").get(obraId)
    if (!obra) return res.status(404).json({ error: "Esa obra no está activa." })
    const asignado = await db.prepare(
      "SELECT 1 AS ok FROM obra_trabajador WHERE obra_id = ? AND usuario_id = ?",
    ).get(obraId, req.usuario.id)
    if (!asignado) {
      return res.status(403).json({ error: "No estás asignado a esta obra." })
    }
    const cuando = momento(req.body)
    if (cuando.error) return res.status(400).json({ error: cuando.error })
    const duplicada = await db.prepare(`
      SELECT id FROM asistencia
      WHERE usuario_id = ? AND obra_id = ? AND fecha = ? AND tipo = ? AND estado != 'ANULADA'
    `).get(req.usuario.id, obraId, cuando.fecha, tipo)
    if (duplicada) {
      return res.status(409).json({ error: `Ya registraste la ${tipo.toLowerCase()} de hoy en esta obra.` })
    }
    const validacion = await validarHorario(db, obraId, cuando.fecha, cuando.hora)
    const gps = req.body.ubicacionGps ? String(req.body.ubicacionGps).slice(0, 80) : null
    const info = await db.prepare(`
      INSERT INTO asistencia (
        usuario_id, obra_id, horario_id, fecha, hora_registro, tipo, ubicacion_gps, estado_horario, estado, creado_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVA', ?)
    `).run(
      req.usuario.id,
      obraId,
      validacion.horarioId,
      cuando.fecha,
      cuando.hora,
      tipo,
      gps,
      validacion.estadoHorario,
      `${cuando.fecha} ${cuando.hora}`,
    )
    const marca = await db.prepare("SELECT * FROM asistencia WHERE id = ?").get(Number(info.lastInsertRowid))
    res.status(201).json(marca)
  }
}

export function misAsistencias(db) {
  return async (req, res) => {
    const filas = await filaReporte(db, "WHERE a.usuario_id = ?", [req.usuario.id])
    res.json(filas)
  }
}

function filtros(req) {
  const partes = []
  const params = []
  if (req.query.desde) {
    partes.push("a.fecha >= ?")
    params.push(String(req.query.desde))
  }
  if (req.query.hasta) {
    partes.push("a.fecha <= ?")
    params.push(String(req.query.hasta))
  }
  if (req.query.trabajadorId) {
    partes.push("a.usuario_id = ?")
    params.push(Number(req.query.trabajadorId))
  }
  if (req.query.obraId) {
    partes.push("a.obra_id = ?")
    params.push(Number(req.query.obraId))
  }
  const where = partes.length ? `WHERE ${partes.join(" AND ")}` : ""
  return { where, params }
}

function csvSeguro(valor) {
  const texto = String(valor ?? "")
  const protegido = /^[=+\-@]/.test(texto) ? `'${texto}` : texto
  return `"${protegido.replaceAll('"', '""')}"`
}

export function reporte(db) {
  return async (req, res) => {
    const { where, params } = filtros(req)
    const filas = await filaReporte(db, where, params)
    if (req.query.formato === "csv") {
      const encabezado = ["Fecha", "Hora", "Tipo", "Trabajador", "Documento", "Obra", "Puntualidad", "Estado", "GPS"]
      const lineas = [encabezado.join(",")]
      for (const fila of filas) {
        lineas.push([
          fila.fecha,
          fila.hora_registro,
          fila.tipo,
          fila.trabajador,
          fila.documento,
          fila.obra,
          fila.estado_horario,
          fila.estado,
          fila.ubicacion_gps || "",
        ].map(csvSeguro).join(","))
      }
      res.setHeader("Content-Type", "text/csv; charset=utf-8")
      res.setHeader("Content-Disposition", "attachment; filename=asistencias-arkos.csv")
      return res.send(`\uFEFF${lineas.join("\n")}`)
    }
    res.json(filas)
  }
}

export function corregir(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    const marca = await db.prepare("SELECT * FROM asistencia WHERE id = ?").get(id)
    if (!marca) return res.status(404).json({ error: "No encontramos esa marcación." })
    if (marca.estado === "ANULADA") {
      return res.status(409).json({ error: "Una marcación anulada no se puede corregir." })
    }
    const fecha = String(req.body.fecha || "").trim()
    const hora = String(req.body.hora || "").trim().slice(0, 8)
    const motivo = String(req.body.motivo || "").trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}/.test(hora)) {
      return res.status(400).json({ error: "Indica la fecha y la hora correctas." })
    }
    if (motivo.length < 5) return res.status(400).json({ error: "Escribe el motivo de la corrección." })
    const horaCompletaValor = hora.length === 5 ? `${hora}:00` : hora
    const validacion = await validarHorario(db, marca.obra_id, fecha, horaCompletaValor)
    const antes = `${marca.fecha} ${marca.hora_registro}`
    await db.prepare(`
      UPDATE asistencia
      SET fecha = ?, hora_registro = ?, horario_id = ?, estado_horario = ?, estado = 'CORREGIDA'
      WHERE id = ?
    `).run(fecha, horaCompletaValor, validacion.horarioId, validacion.estadoHorario, id)
    await registrarAuditoria(db, {
      asistenciaId: id,
      responsableId: req.usuario.id,
      accion: "CORRECCION",
      motivo,
      detalle: `Antes: ${antes}. Ahora: ${fecha} ${horaCompletaValor}.`,
    })
    res.json(await db.prepare("SELECT * FROM asistencia WHERE id = ?").get(id))
  }
}

export function anular(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    const marca = await db.prepare("SELECT * FROM asistencia WHERE id = ?").get(id)
    if (!marca) return res.status(404).json({ error: "No encontramos esa marcación." })
    if (marca.estado === "ANULADA") {
      return res.status(409).json({ error: "Esa marcación ya estaba anulada." })
    }
    const motivo = String(req.body.motivo || "").trim()
    if (motivo.length < 5) return res.status(400).json({ error: "Escribe por qué se anula el registro." })
    await db.prepare("UPDATE asistencia SET estado = 'ANULADA' WHERE id = ?").run(id)
    await registrarAuditoria(db, {
      asistenciaId: id,
      responsableId: req.usuario.id,
      accion: "ANULACION",
      motivo,
      detalle: `${marca.tipo} del ${marca.fecha} ${marca.hora_registro}`,
    })
    res.json(await db.prepare("SELECT * FROM asistencia WHERE id = ?").get(id))
  }
}

export function solicitarAjuste(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    const marca = await db.prepare("SELECT * FROM asistencia WHERE id = ?").get(id)
    if (!marca) return res.status(404).json({ error: "No encontramos esa marcación." })
    if (req.usuario.rol !== "ADMINISTRADOR" && marca.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: "Solo puedes pedir corrección de tus marcaciones." })
    }
    if (marca.estado === "ANULADA") {
      return res.status(409).json({ error: "No se puede corregir una marcación anulada." })
    }
    const pendiente = await db.prepare(
      "SELECT id FROM solicitud_ajuste WHERE asistencia_id = ? AND estado = 'PENDIENTE'",
    ).get(id)
    if (pendiente) return res.status(409).json({ error: "Ya hay una solicitud pendiente para esta marcación." })
    const fecha = String(req.body.fecha || "").trim()
    const hora = String(req.body.hora || "").trim().slice(0, 5)
    const motivo = String(req.body.motivo || "").trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora) || motivo.length < 5) {
      return res.status(400).json({ error: "Indica fecha, hora y el motivo del ajuste." })
    }
    const info = await db.prepare(`
      INSERT INTO solicitud_ajuste (asistencia_id, solicitante_id, fecha_propuesta, hora_propuesta, motivo)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.usuario.id, fecha, hora, motivo)
    res.status(201).json(await db.prepare("SELECT * FROM solicitud_ajuste WHERE id = ?").get(Number(info.lastInsertRowid)))
  }
}

export function listarSolicitudes(db) {
  return async (req, res) => {
    const filas = await db.prepare(`
      SELECT s.*, u.nombre AS solicitante, a.tipo, a.fecha, a.hora_registro, o.nombre AS obra
      FROM solicitud_ajuste s
      JOIN usuario u ON u.id = s.solicitante_id
      JOIN asistencia a ON a.id = s.asistencia_id
      JOIN obra o ON o.id = a.obra_id
      WHERE s.estado = 'PENDIENTE'
      ORDER BY s.id DESC
    `).all()
    res.json(filas)
  }
}

export function resolverSolicitud(db) {
  return async (req, res) => {
    const id = Number(req.params.id)
    const solicitud = await db.prepare("SELECT * FROM solicitud_ajuste WHERE id = ?").get(id)
    if (!solicitud || solicitud.estado !== "PENDIENTE") {
      return res.status(404).json({ error: "Esa solicitud ya no está pendiente." })
    }
    const ahora = partesBogota()
    const decision = req.params.decision
    if (decision === "rechazar") {
      await db.prepare(`
        UPDATE solicitud_ajuste SET estado = 'RECHAZADA', resuelto_por = ?, resuelto_en = ? WHERE id = ?
      `).run(req.usuario.id, `${ahora.fecha} ${ahora.hora}`, id)
      return res.json({ ok: true })
    }
    if (decision !== "aprobar") return res.status(404).json({ error: "Decisión no reconocida." })
    const marca = await db.prepare("SELECT * FROM asistencia WHERE id = ?").get(solicitud.asistencia_id)
    const hora = `${solicitud.hora_propuesta}:00`.slice(0, 8)
    const validacion = await validarHorario(db, marca.obra_id, solicitud.fecha_propuesta, hora)
    await db.prepare(`
      UPDATE asistencia
      SET fecha = ?, hora_registro = ?, horario_id = ?, estado_horario = ?, estado = 'CORREGIDA'
      WHERE id = ?
    `).run(solicitud.fecha_propuesta, hora, validacion.horarioId, validacion.estadoHorario, marca.id)
    await db.prepare(`
      UPDATE solicitud_ajuste SET estado = 'APROBADA', resuelto_por = ?, resuelto_en = ? WHERE id = ?
    `).run(req.usuario.id, `${ahora.fecha} ${ahora.hora}`, id)
    await registrarAuditoria(db, {
      asistenciaId: marca.id,
      responsableId: req.usuario.id,
      accion: "CORRECCION",
      motivo: solicitud.motivo,
      detalle: `Aprobó la solicitud ${id}. Antes: ${marca.fecha} ${marca.hora_registro}.`,
    })
    res.json({ ok: true })
  }
}

function horaCompleta(valor) {
  const hora = String(valor || "").trim().slice(0, 5)
  if (!/^\d{2}:\d{2}$/.test(hora)) return null
  return `${hora}:00`
}

function cargoVisible(fila) {
  const cargo = String(fila.cargo || "").trim()
  if (cargo) return cargo
  return fila.rol === "ADMINISTRADOR" ? "Administrador" : "Trabajador"
}

async function filasJornada(db) {
  const filas = await db.prepare(`
    SELECT e.fecha AS fecha_ingreso, e.hora_registro AS hora_ingreso, s.hora_registro AS hora_salida,
           u.cargo, u.rol, u.nombre AS trabajador, o.nombre AS obra, e.estado_horario, e.usuario_id, e.obra_id
    FROM asistencia e
    JOIN usuario u ON u.id = e.usuario_id
    JOIN obra o ON o.id = e.obra_id
    LEFT JOIN asistencia s
      ON s.usuario_id = e.usuario_id AND s.obra_id = e.obra_id AND s.fecha = e.fecha
     AND s.tipo = 'SALIDA' AND s.estado != 'ANULADA'
    WHERE e.tipo = 'ENTRADA' AND e.estado != 'ANULADA'
    ORDER BY e.fecha DESC, e.hora_registro DESC
  `).all()
  return filas.map((fila) => ({
    fechaIngreso: fila.fecha_ingreso,
    horaIngreso: fila.hora_ingreso,
    horaSalida: fila.hora_salida,
    cargo: cargoVisible(fila),
    trabajador: fila.trabajador,
    obra: fila.obra,
    usuarioId: fila.usuario_id,
    obraId: fila.obra_id,
    estadoHorario: fila.estado_horario,
    estado: fila.hora_salida ? "Ya salió" : "Activo",
  }))
}

export function registrarJornada(db) {
  return async (req, res) => {
    const usuarioId = Number(req.body.usuarioId)
    const obraId = Number(req.body.obraId)
    const fecha = String(req.body.fecha || "").trim()
    const ingreso = horaCompleta(req.body.horaIngreso)
    const salidaTexto = String(req.body.horaSalida || "").trim()
    const salida = salidaTexto ? horaCompleta(salidaTexto) : null
    if (!usuarioId || !obraId || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !ingreso) {
      return res.status(400).json({ error: "Elige la persona, la obra, la fecha y la hora de ingreso." })
    }
    if (salidaTexto && !salida) {
      return res.status(400).json({ error: "La hora de salida no es válida." })
    }
    if (salida && aMinutos(salida) <= aMinutos(ingreso)) {
      return res.status(400).json({ error: "La salida debe ser después del ingreso." })
    }
    const obra = await db.prepare("SELECT id FROM obra WHERE id = ? AND estado = 1").get(obraId)
    if (!obra) return res.status(404).json({ error: "Esa obra no está activa." })
    const persona = await db.prepare("SELECT id FROM usuario WHERE id = ? AND estado = 1").get(usuarioId)
    if (!persona) return res.status(404).json({ error: "No encontramos a esa persona." })
    const asignado = await db.prepare(
      "SELECT 1 AS ok FROM obra_trabajador WHERE obra_id = ? AND usuario_id = ?",
    ).get(obraId, usuarioId)
    if (!asignado) {
      return res.status(403).json({ error: "Esa persona no está asignada a la obra." })
    }
    const duplicada = await db.prepare(`
      SELECT id FROM asistencia
      WHERE usuario_id = ? AND obra_id = ? AND fecha = ? AND tipo = 'ENTRADA' AND estado != 'ANULADA'
    `).get(usuarioId, obraId, fecha)
    if (duplicada) {
      return res.status(409).json({ error: "Ese día ya tiene una entrada en esta obra." })
    }
    const validacion = await validarHorario(db, obraId, fecha, ingreso)
    const insertar = db.prepare(`
      INSERT INTO asistencia (
        usuario_id, obra_id, horario_id, fecha, hora_registro, tipo, ubicacion_gps, estado_horario, estado, creado_en
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 'ACTIVA', ?)
    `)
    await db.exec("BEGIN")
    try {
      await insertar.run(usuarioId, obraId, validacion.horarioId, fecha, ingreso, "ENTRADA", validacion.estadoHorario, `${fecha} ${ingreso}`)
      if (salida) {
        const salidaValidada = await validarHorario(db, obraId, fecha, salida)
        await insertar.run(usuarioId, obraId, salidaValidada.horarioId, fecha, salida, "SALIDA", salidaValidada.estadoHorario, `${fecha} ${salida}`)
      }
      await db.exec("COMMIT")
    } catch (error) {
      await db.exec("ROLLBACK")
      throw error
    }
    const jornadas = await filasJornada(db)
    const jornada = jornadas.find((fila) => fila.usuarioId === usuarioId && fila.obraId === obraId && fila.fechaIngreso === fecha)
    res.status(201).json(jornada)
  }
}

export function listarJornadas(db) {
  return async (_req, res) => {
    res.json(await filasJornada(db))
  }
}

export function listarAuditoria(db) {
  return async (req, res) => {
    const filas = await db.prepare(`
      SELECT au.*, r.nombre AS responsable, a.tipo, a.fecha AS fecha_marca, o.nombre AS obra
      FROM auditoria au
      JOIN usuario r ON r.id = au.responsable_id
      JOIN asistencia a ON a.id = au.asistencia_id
      JOIN obra o ON o.id = a.obra_id
      ORDER BY au.id DESC
    `).all()
    res.json(filas)
  }
}
