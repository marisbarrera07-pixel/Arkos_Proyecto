import { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../auth.jsx"
import { leerCola, sincronizarCola } from "../api.js"

const ENLACES_ADMIN = [
  ["/asistencias", "Asistencias"],
  ["/usuarios", "Personal"],
  ["/obras", "Obras"],
  ["/horarios", "Horarios"],
  ["/auditoria", "Auditoría"],
]

export function Layout({ children }) {
  const { sesion, salir } = useAuth()
  const navegar = useNavigate()
  const [cola, setCola] = useState(leerCola().length)
  const admin = sesion.usuario.rol === "ADMINISTRADOR"

  useEffect(() => {
    const actualizar = () => setCola(leerCola().length)
    window.addEventListener("arkos-cola", actualizar)
    window.addEventListener("online", sincronizarCola)
    sincronizarCola()
    return () => {
      window.removeEventListener("arkos-cola", actualizar)
      window.removeEventListener("online", sincronizarCola)
    }
  }, [])

  return (
    <div className="app">
      <header className="barra">
        <div>
          <p className="marca">ARKOS</p>
          <p className="submarca">Asistencia en obra</p>
        </div>
        <div className="sesion">
          <span>{sesion.usuario.nombre}</span>
          <button className="btn secundario" onClick={() => { salir(); navegar("/login") }}>Salir</button>
        </div>
      </header>
      <nav className="menu">
        {admin
          ? ENLACES_ADMIN.map(([to, texto]) => <NavLink key={to} to={to}>{texto}</NavLink>)
          : (
            <>
              <NavLink to="/marcar">Marcar</NavLink>
              <NavLink to="/historial">Mi historial</NavLink>
            </>
          )}
      </nav>
      {cola > 0 && <p className="aviso">Hay {cola} marcación(es) guardadas sin señal. Se enviarán cuando vuelva la conexión.</p>}
      <main>{children}</main>
    </div>
  )
}
