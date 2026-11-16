import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api.js"
import { useAuth } from "../auth.jsx"

export function Login() {
  const { entrar } = useAuth()
  const navegar = useNavigate()
  const [documento, setDocumento] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [verClave, setVerClave] = useState(false)
  const [error, setError] = useState("")
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setError("")
    try {
      const datos = await api("/auth/login", { method: "POST", body: { documento, contrasena } })
      entrar(datos)
      navegar(datos.usuario.rol === "ADMINISTRADOR" ? "/asistencias" : "/marcar")
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <section className="login-marca">
        <p className="marca">ARKOS</p>
        <h1>Asistencia de trabajadores en obra</h1>
        <p className="empresa">ACM Diseño y Construcciones SAS</p>
      </section>
      <section className="login-formulario">
        <form onSubmit={enviar}>
          <div className="login-cabecera">
            <h1>Iniciar sesión</h1>
            <p className="ayuda">Ingresa con tu documento y tu contraseña.</p>
          </div>
          {error && <p className="error">{error}</p>}
          <label>
            Documento
            <input
              value={documento}
              onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ""))}
              placeholder="Número de documento"
              inputMode="numeric"
              autoComplete="username"
              required
            />
            <span className="login-pista">Solo números, sin puntos ni espacios.</span>
          </label>
          <label>
            Contraseña
            <div className="login-clave">
              <input
                type={verClave ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className="login-mostrar" onClick={() => setVerClave((v) => !v)}>
                {verClave ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>
          <button className="btn" disabled={enviando}>{enviando ? "Entrando..." : "Entrar"}</button>
          <p className="login-olvido">¿Olvidaste tu contraseña? Pide a un administrador que la restablezca.</p>
        </form>
      </section>
    </div>
  )
}
