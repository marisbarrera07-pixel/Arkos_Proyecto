import { useEffect, useState } from "react"
import { api } from "../api.js"
import { Modal } from "../components/Modal.jsx"

const HOY = new Date().toISOString().slice(0, 10)

export function Obras() {
  const [obras, setObras] = useState([])
  const [personal, setPersonal] = useState([])
  const [filtro, setFiltro] = useState("")
  const [error, setError] = useState("")
  const [form, setForm] = useState(null)
  const [asignar, setAsignar] = useState(null)

  async function cargar(estado = filtro) {
    const query = estado ? `?estado=${estado}` : ""
    const [lista, gente] = await Promise.all([
      api(`/obras${query}`),
      api("/usuarios?page=todas"),
    ])
    setObras(lista)
    setPersonal(gente.filas)
  }

  useEffect(() => { cargar().catch((err) => setError(err.message)) }, [])

  async function guardar(evento) {
    evento.preventDefault()
    setError("")
    try {
      if (form.id) await api(`/obras/${form.id}`, { method: "PUT", body: form })
      else await api("/obras", { method: "POST", body: form })
      setForm(null)
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  async function cambiarEstado(obra, activa) {
    try {
      await api(`/obras/${obra.id}`, { method: "PUT", body: { ...obra, fechaInicio: obra.fecha_inicio, estado: activa } })
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  async function guardarAsignacion(evento) {
    evento.preventDefault()
    try {
      await api(`/obras/${asignar.id}/asignar-trabajadores`, {
        method: "POST",
        body: { trabajadorIds: asignar.ids },
      })
      setAsignar(null)
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <div className="encabezado">
        <h1>Obras</h1>
        <button className="btn" onClick={() => setForm({ nombre: "", ubicacion: "", fechaInicio: HOY })}>Nueva obra</button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="filtros">
        <button className={filtro === "" ? "btn" : "btn secundario"} onClick={() => { setFiltro(""); cargar("") }}>Todas</button>
        <button className={filtro === "activa" ? "btn" : "btn secundario"} onClick={() => { setFiltro("activa"); cargar("activa") }}>Activas</button>
        <button className={filtro === "inactiva" ? "btn" : "btn secundario"} onClick={() => { setFiltro("inactiva"); cargar("inactiva") }}>Inactivas</button>
      </div>
      <div className="rejilla">
        {obras.map((obra) => (
          <article className="tarjeta" key={obra.id}>
            <h2>{obra.nombre}</h2>
            <p>{obra.ubicacion}</p>
            <p className="ayuda">Inicio {obra.fecha_inicio} · {obra.estado ? "Activa" : "Inactiva"}</p>
            <p>{obra.trabajadores.length} trabajador(es) asignado(s)</p>
            <div className="acciones">
              <button className="btn pequeno" onClick={() => setForm({ ...obra, fechaInicio: obra.fecha_inicio })}>Editar</button>
              <button className="btn pequeno" onClick={() => setAsignar({ id: obra.id, nombre: obra.nombre, ids: obra.trabajadores.map((t) => t.id) })}>Asignar</button>
              {obra.estado
                ? <button className="btn pequeno peligro" onClick={() => cambiarEstado(obra, false)}>Desactivar</button>
                : <button className="btn pequeno" onClick={() => cambiarEstado(obra, true)}>Activar</button>}
            </div>
          </article>
        ))}
      </div>
      {form && (
        <Modal titulo={form.id ? "Editar obra" : "Nueva obra"} onCerrar={() => setForm(null)}>
          <form onSubmit={guardar} className="formulario">
            <label>Nombre<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></label>
            <label>Ubicación<input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} required /></label>
            <label>Fecha de inicio<input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} required /></label>
            <button className="btn">Guardar</button>
          </form>
        </Modal>
      )}
      {asignar && (
        <Modal titulo={`Asignar en ${asignar.nombre}`} onCerrar={() => setAsignar(null)}>
          <form onSubmit={guardarAsignacion} className="formulario">
            <p className="ayuda">Marca quién labora en esta obra. Para desactivar la obra, primero deja la lista vacía.</p>
            {personal.map((persona) => (
              <label className="check" key={persona.id}>
                <input
                  type="checkbox"
                  checked={asignar.ids.includes(persona.id)}
                  onChange={(e) => {
                    const ids = e.target.checked
                      ? [...asignar.ids, persona.id]
                      : asignar.ids.filter((id) => id !== persona.id)
                    setAsignar({ ...asignar, ids })
                  }}
                />
                {persona.nombre} · {persona.documento}
              </label>
            ))}
            <button className="btn">Guardar asignación</button>
          </form>
        </Modal>
      )}
    </section>
  )
}
