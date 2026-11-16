import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "./auth.jsx"
import { Layout } from "./components/Layout.jsx"
import { Login } from "./pages/Login.jsx"
import { Marcar } from "./pages/Marcar.jsx"
import { Historial } from "./pages/Historial.jsx"
import { Usuarios } from "./pages/Usuarios.jsx"
import { Obras } from "./pages/Obras.jsx"
import { Horarios } from "./pages/Horarios.jsx"
import { Asistencias } from "./pages/Asistencias.jsx"
import { Auditoria } from "./pages/Auditoria.jsx"

function Protegida({ rol, children }) {
  const { sesion } = useAuth()
  if (!sesion) return <Navigate to="/login" replace />
  if (rol && sesion.usuario.rol !== rol) {
    const destino = sesion.usuario.rol === "ADMINISTRADOR" ? "/asistencias" : "/marcar"
    return <Navigate to={destino} replace />
  }
  return <Layout>{children}</Layout>
}

export default function App() {
  const { sesion } = useAuth()
  const inicio = sesion?.usuario.rol === "ADMINISTRADOR" ? "/asistencias" : "/marcar"
  return (
    <Routes>
      <Route path="/login" element={sesion ? <Navigate to={inicio} replace /> : <Login />} />
      <Route path="/marcar" element={<Protegida rol="TRABAJADOR"><Marcar /></Protegida>} />
      <Route path="/historial" element={<Protegida rol="TRABAJADOR"><Historial /></Protegida>} />
      <Route path="/usuarios" element={<Protegida rol="ADMINISTRADOR"><Usuarios /></Protegida>} />
      <Route path="/obras" element={<Protegida rol="ADMINISTRADOR"><Obras /></Protegida>} />
      <Route path="/horarios" element={<Protegida rol="ADMINISTRADOR"><Horarios /></Protegida>} />
      <Route path="/asistencias" element={<Protegida rol="ADMINISTRADOR"><Asistencias /></Protegida>} />
      <Route path="/auditoria" element={<Protegida rol="ADMINISTRADOR"><Auditoria /></Protegida>} />
      <Route path="*" element={<Navigate to={sesion ? inicio : "/login"} replace />} />
    </Routes>
  )
}
