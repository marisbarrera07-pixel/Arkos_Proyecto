import "dotenv/config"
import { openDb, borrarBase } from "../server/db.js"
import { createApp } from "../server/app.js"
import { partesBogota } from "../server/time.js"

process.env.JWT_SECRET = "prueba-arkos"
process.env.DB_NAME = "ArkosTest"

let base
const domingo = new Date()
domingo.setUTCDate(domingo.getUTCDate() - domingo.getUTCDay())
domingo.setUTCHours(17, 0, 0, 0)
const fechaDomingo = partesBogota(domingo).fecha

function assert(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje)
}

async function pedir(ruta, { method = "GET", token, body } = {}) {
  const respuesta = await fetch(base + ruta, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const texto = await respuesta.text()
  return { status: respuesta.status, data: texto ? JSON.parse(texto) : null, texto }
}

async function main() {
  await borrarBase("ArkosTest")
  const db = await openDb()
  const server = createApp(db).listen(0)
  await new Promise((resolve) => server.once("listening", resolve))
  base = `http://127.0.0.1:${server.address().port}`
  try {
  const malo = await pedir("/api/auth/login", { method: "POST", body: { documento: "10000001", contrasena: "no" } })
  assert(malo.status === 401, "clave incorrecta")

  const admin = await pedir("/api/auth/login", { method: "POST", body: { documento: "10000001", contrasena: "Admin123*" } })
  assert(admin.status === 200 && admin.data.usuario.rol === "ADMINISTRADOR", "login admin")

  const trabajador = await pedir("/api/auth/login", { method: "POST", body: { documento: "10000002", contrasena: "Obra123*" } })
  assert(trabajador.status === 200, "login trabajador")
  const prohibido = await pedir("/api/usuarios", { token: trabajador.data.token })
  assert(prohibido.status === 403, "trabajador no administra")

  const obras = await pedir("/api/obras/mias", { token: trabajador.data.token })
  assert(obras.data.length === 1, "obra asignada")
  const obraId = obras.data[0].id

  const fuera = await pedir("/api/asistencias/registrar", {
    method: "POST",
    token: trabajador.data.token,
    body: { obraId, tipo: "ENTRADA", offline: true, fechaHora: domingo.toISOString() },
  })
  assert(fuera.status === 201 && fuera.data.estado_horario === "FUERA_DE_HORARIO", "domingo fuera de horario")

  const entrada = await pedir("/api/asistencias/registrar", {
    method: "POST",
    token: trabajador.data.token,
    body: { obraId, tipo: "ENTRADA" },
  })
  assert(entrada.status === 201 && entrada.data.estado_horario === "A_TIEMPO", "entrada a tiempo")

  const duplicada = await pedir("/api/asistencias/registrar", {
    method: "POST",
    token: trabajador.data.token,
    body: { obraId, tipo: "ENTRADA" },
  })
  assert(duplicada.status === 409, "no duplica entrada")

  const correccion = await pedir(`/api/asistencias/${entrada.data.id}/corregir`, {
    method: "PUT",
    token: admin.data.token,
    body: { fecha: entrada.data.fecha, hora: "07:05", motivo: "Llegó y el celular falló" },
  })
  assert(correccion.status === 200 && correccion.data.estado === "CORREGIDA", "corrección")

  const auditoria = await pedir("/api/auditoria", { token: admin.data.token })
  assert(auditoria.data.some((fila) => fila.accion === "CORRECCION"), "queda en auditoría")

  const anular = await pedir(`/api/asistencias/${fuera.data.id}/anular`, {
    method: "PATCH",
    token: admin.data.token,
    body: { motivo: "Marcación duplicada de prueba" },
  })
  assert(anular.status === 200 && anular.data.estado === "ANULADA", "anulación")

  const bloqueoObra = await pedir(`/api/obras/${obraId}`, {
    method: "PUT",
    token: admin.data.token,
    body: { estado: false },
  })
  assert(bloqueoObra.status === 409, "obra con personal no se desactiva")

  const horarioId = obras.data[0].horarios[0].id
  const bloqueoHorario = await pedir(`/api/horarios/${horarioId}`, {
    method: "PUT",
    token: admin.data.token,
    body: { estado: 0 },
  })
  assert(bloqueoHorario.status === 409, "horario con marcas no se desactiva")

  const nuevo = await pedir("/api/usuarios", {
    method: "POST",
    token: admin.data.token,
    body: { documento: "30000003", nombre: "Marta Gómez", contrasena: "Clave123", rol: "TRABAJADOR" },
  })
  assert(nuevo.status === 201, "alta de trabajador")
  await pedir(`/api/usuarios/${nuevo.data.id}`, { method: "DELETE", token: admin.data.token })
  const inactivo = await pedir("/api/auth/login", { method: "POST", body: { documento: "30000003", contrasena: "Clave123" } })
  assert(inactivo.status === 403, "inactivo no entra")

  const otra = await pedir("/api/obras", {
    method: "POST",
    token: admin.data.token,
    body: { nombre: "Obra sin marcas", ubicacion: "Medellín", fechaInicio: "2026-10-01" },
  })
  assert(otra.status === 201, "obra extra")
  const porObra = await pedir(`/api/asistencias/reporte?obraId=${otra.data.id}`, { token: admin.data.token })
  assert(porObra.status === 200 && porObra.data.length === 0, "filtra por obra y excluye otras")

  const porFecha = await pedir(`/api/asistencias/reporte?desde=${fechaDomingo}&hasta=${fechaDomingo}`, { token: admin.data.token })
  assert(porFecha.status === 200, "filtra por fecha")
  assert(porFecha.data.some((fila) => fila.id === fuera.data.id), "incluye el extremo del rango")
  assert(porFecha.data.every((fila) => fila.fecha === fechaDomingo), "excluye fechas fuera del rango")
  assert(!porFecha.data.some((fila) => fila.id === entrada.data.id), "excluye la marcación de otro día")

  const conSalida = await pedir("/api/asistencias/jornada", {
    method: "POST",
    token: admin.data.token,
    body: {
      usuarioId: trabajador.data.usuario.id,
      obraId,
      fecha: "2026-10-12",
      horaIngreso: "08:00",
      horaSalida: "17:00",
    },
  })
  assert(conSalida.status === 201 && conSalida.data.estado === "Ya salió", "jornada con salida")
  assert(conSalida.data.estadoHorario === "A_TIEMPO" && conSalida.data.cargo, "ingreso puntual y con cargo")

  const soloIngreso = await pedir("/api/asistencias/jornada", {
    method: "POST",
    token: admin.data.token,
    body: {
      usuarioId: trabajador.data.usuario.id,
      obraId,
      fecha: "2026-10-14",
      horaIngreso: "08:00",
      horaSalida: "",
    },
  })
  assert(soloIngreso.status === 201 && soloIngreso.data.estado === "Activo", "jornada solo con ingreso")

  const salidaTemprana = await pedir("/api/asistencias/jornada", {
    method: "POST",
    token: admin.data.token,
    body: {
      usuarioId: trabajador.data.usuario.id,
      obraId,
      fecha: "2026-10-15",
      horaIngreso: "10:00",
      horaSalida: "09:00",
    },
  })
  assert(salidaTemprana.status === 400, "salida anterior al ingreso")
  const historial = await pedir("/api/asistencias/jornadas", { token: admin.data.token })
  assert(!historial.data.some((fila) => fila.fechaIngreso === "2026-10-15"), "no guarda la jornada inválida")

  const csv = await fetch(`${base}/api/asistencias/reporte?formato=csv`, {
    headers: { Authorization: `Bearer ${admin.data.token}` },
  })
  assert(csv.status === 200 && (await csv.text()).includes("Luis"), "exporta csv")

    console.log("Flujo de asistencia verificado")
  } finally {
    await new Promise((resolve) => server.close(resolve))
    await db.close()
    await borrarBase("ArkosTest")
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
