import { useEffect, useState } from "react"
import { api } from "../api.js"
import { Modal } from "../components/Modal.jsx"

const VACIO = { documento: "", nombre: "", correo: "", telefono: "", cargo: "", contrasena: "", rol: "TRABAJADOR" }

export function Usuarios() {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [datos, setDatos] = useState({ filas: [], total: 0 })
  const [error, setError] = useState("")
  const [form, setForm] = useState(null)
  const [inactivos, setInactivos] = useState(false)

  async function cargar(pagina = page, texto = q, verInactivos = inactivos) {
    const query = new URLSearchParams({ q: texto, page: String(pagina), incluirInactivos: verInactivos ? "1" : "0" })
    setDatos(await api(`/usuarios?${query}`))
  }

  useEffect(() => { cargar(1, q, inactivos).catch((err) => setError(err.message)) }, [])

  function campo(nombre, valor) {
    setForm({ ...form, [nombre]: valor })
  }

  async function guardar(evento) {
    evento.preventDefault()
    setError("")
    try {
      if (form.id) await api(`/usuarios/${form.id}`, { method: "PUT", body: form })
      else await api("/usuarios", { method: "POST", body: form })
      setForm(null)
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  async function desactivar(id) {
    if (!confirm("¿Desactivar a esta persona? Se conserva el historial.")) return
    try {
      await api(`/usuarios/${id}`, { method: "DELETE" })
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  async function cambiarRol(usuario, rol) {
    try {
      await api(`/usuarios/${usuario.id}/rol`, { method: "PATCH", body: { rol } })
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const paginas = Math.max(1, Math.ceil(datos.total / 8))

  return (
    <section>
      <div className="encabezado">
        <h1>Personal</h1>
        <button className="btn" onClick={() => setForm({ ...VACIO })}>Nuevo trabajador</button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="filtros">
        <input placeholder="Buscar por nombre o documento" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn secundario" onClick={() => { setPage(1); cargar(1, q, inactivos) }}>Buscar</button>
        <label className="check"><input type="checkbox" checked={inactivos} onChange={(e) => { setInactivos(e.target.checked); cargar(1, q, e.target.checked) }} /> Ver inactivos</label>
      </div>
      <div className="tabla-contenedor">
        <table>
          <thead><tr><th>Nombre</th><th>Documento</th><th>Cargo</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {datos.filas.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.documento}</td>
                <td>{usuario.cargo}</td>
                <td>
                  <select value={usuario.rol} onChange={(e) => cambiarRol(usuario, e.target.value)}>
                    <option value="TRABAJADOR">Trabajador</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </td>
                <td>{usuario.estado ? "Activo" : "Inactivo"}</td>
                <td className="acciones-tabla">
                  <button className="btn pequeno" onClick={() => setForm({ ...usuario, contrasena: "" })}>Editar</button>
                  {usuario.estado === 1 && <button className="btn pequeno peligro" onClick={() => desactivar(usuario.id)}>Desactivar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="paginacion">
        <button className="btn secundario" disabled={page <= 1} onClick={() => { setPage(page - 1); cargar(page - 1) }}>Anterior</button>
        <span>{page} / {paginas}</span>
        <button className="btn secundario" disabled={page >= paginas} onClick={() => { setPage(page + 1); cargar(page + 1) }}>Siguiente</button>
      </div>
      {form && (
        <Modal titulo={form.id ? "Editar trabajador" : "Nuevo trabajador"} onCerrar={() => setForm(null)}>
          <form onSubmit={guardar} className="formulario">
            <label>Documento<input value={form.documento} onChange={(e) => campo("documento", e.target.value)} required /></label>
            <label>Nombre<input value={form.nombre} onChange={(e) => campo("nombre", e.target.value)} required /></label>
            <label>Correo<input value={form.correo || ""} onChange={(e) => campo("correo", e.target.value)} /></label>
            <label>Teléfono<input value={form.telefono || ""} onChange={(e) => campo("telefono", e.target.value)} /></label>
            <label>Cargo<input value={form.cargo || ""} onChange={(e) => campo("cargo", e.target.value)} /></label>
            <label>Contraseña<input type="password" value={form.contrasena} onChange={(e) => campo("contrasena", e.target.value)} placeholder={form.id ? "Déjala vacía para no cambiarla" : ""} required={!form.id} /></label>
            <label>Rol
              <select value={form.rol} onChange={(e) => campo("rol", e.target.value)}>
                <option value="TRABAJADOR">Trabajador</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </label>
            <p className="ayuda">Los datos personales se usan solo para la asistencia y la nómina, conforme a la Ley 1581 de 2012.</p>
            <button className="btn">Guardar</button>
          </form>
        </Modal>
      )}
    </section>
  )
}
