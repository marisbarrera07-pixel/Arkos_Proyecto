import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { publico } from "../db.js"

export function login(db) {
  return async (req, res) => {
    const documento = String(req.body.documento || "").trim()
    const contrasena = String(req.body.contrasena || "")
    if (!documento || !contrasena) {
      return res.status(400).json({ error: "Escribe el documento y la contraseña." })
    }
    const usuario = await db.prepare("SELECT * FROM usuario WHERE documento = ?").get(documento)
    if (!usuario || !bcrypt.compareSync(contrasena, usuario.contrasena_hash)) {
      return res.status(401).json({ error: "Documento o contraseña incorrectos." })
    }
    if (!usuario.estado) {
      return res.status(403).json({ error: "Tu usuario está desactivado. Habla con el administrador." })
    }
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    )
    res.json({ token, usuario: publico(usuario) })
  }
}
