import jwt from "jsonwebtoken"

export function crearAuth(db) {
  async function verificarToken(req, res, next) {
    const encabezado = req.headers.authorization || ""
    const token = encabezado.startsWith("Bearer ") ? encabezado.slice(7) : ""
    if (!token) {
      return res.status(401).json({ error: "Debes iniciar sesión." })
    }
    try {
      const datos = jwt.verify(token, process.env.JWT_SECRET)
      const fila = await db.prepare("SELECT id, rol, estado, nombre FROM usuario WHERE id = ?").get(datos.id)
      if (!fila || !fila.estado) {
        return res.status(401).json({ error: "Tu usuario está desactivado. Habla con el administrador." })
      }
      req.usuario = { id: fila.id, rol: fila.rol, nombre: fila.nombre }
      next()
    } catch {
      return res.status(401).json({ error: "La sesión expiró. Vuelve a entrar." })
    }
  }

  function verificarRol(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.usuario.rol)) {
        return res.status(403).json({ error: "No tienes permiso para esta acción." })
      }
      next()
    }
  }

  return { verificarToken, verificarRol }
}
