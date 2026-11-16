import { Router } from "express"
import { crearAuth } from "./middleware/auth.js"
import { login } from "./controllers/authController.js"
import {
  actualizarUsuario,
  cambiarRol,
  crearUsuario,
  desactivarUsuario,
  listarUsuarios,
} from "./controllers/usuarioController.js"
import {
  actualizarObra,
  asignarTrabajadores,
  crearObra,
  listarObras,
  misObras,
} from "./controllers/obraController.js"
import {
  actualizarHorario,
  crearHorario,
  listarHorarios,
} from "./controllers/horarioController.js"
import {
  anular,
  corregir,
  listarAuditoria,
  listarSolicitudes,
  misAsistencias,
  registrar,
  registrarJornada,
  listarJornadas,
  reporte,
  resolverSolicitud,
  solicitarAjuste,
} from "./controllers/asistenciaController.js"

export function buildRouter(db) {
  const router = Router()
  const auth = crearAuth(db)
  const admin = auth.verificarRol("ADMINISTRADOR")

  router.get("/salud", (_req, res) => res.json({ ok: true, app: "arkos" }))
  router.post("/auth/login", login(db))

  router.use(auth.verificarToken)
  router.get("/obras/mias", misObras(db))
  router.post("/asistencias/registrar", registrar(db))
  router.get("/asistencias/mias", misAsistencias(db))
  router.post("/asistencias/:id/solicitar", solicitarAjuste(db))

  router.get("/usuarios", admin, listarUsuarios(db))
  router.post("/usuarios", admin, crearUsuario(db))
  router.put("/usuarios/:id", admin, actualizarUsuario(db))
  router.delete("/usuarios/:id", admin, desactivarUsuario(db))
  router.patch("/usuarios/:id/rol", admin, cambiarRol(db))

  router.get("/obras", admin, listarObras(db))
  router.post("/obras", admin, crearObra(db))
  router.put("/obras/:id", admin, actualizarObra(db))
  router.post("/obras/:id/asignar-trabajadores", admin, asignarTrabajadores(db))

  router.get("/horarios", admin, listarHorarios(db))
  router.post("/horarios", admin, crearHorario(db))
  router.put("/horarios/:id", admin, actualizarHorario(db))

  router.post("/asistencias/jornada", admin, registrarJornada(db))
  router.get("/asistencias/jornadas", admin, listarJornadas(db))
  router.get("/asistencias/reporte", admin, reporte(db))
  router.get("/asistencias/solicitudes", admin, listarSolicitudes(db))
  router.post("/asistencias/solicitudes/:id/:decision", admin, resolverSolicitud(db))
  router.put("/asistencias/:id/corregir", admin, corregir(db))
  router.patch("/asistencias/:id/anular", admin, anular(db))
  router.get("/auditoria", admin, listarAuditoria(db))

  return router
}
