import { useEffect, useState } from "react"
import { api } from "../api.js"
import { textoDias } from "../formato.js"

const DIAS = [
  ["1", "Lun"], ["2", "Mar"], ["3", "Mié"], ["4", "Jue"], ["5", "Vie"], ["6", "Sáb"], ["0", "Dom"],
]

const NUEVO = { obraId: "", horaEntrada: "07:00", horaSalida: "17:00", diasLaborales: ["1", "2", "3", "4", "5"] }

export function Horarios() {
  const [obras, setObras] = useState([])
  const [horarios, setHorarios] = useState([])
  const [form, setForm] = useState(NUEVO)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  async function cargar() {
    const [listaObras, listaHorarios] = await Promise.all([api("/obras?estado=activa"), api("/horarios")])
    setObras(listaObras)
    setHorarios(listaHorarios)
    setForm((actual) => ({ ...actual, obraId: actual.obraId || listaObras[0]?.id || "" }))
  }

  useEffect(() => { cargar().catch((err) => setError(err.message)) }, [])

  function alternarDia(dia) {
    const dias = form.diasLaborales.includes(dia)
      ? form.diasLaborales.filter((item) => item !== dia)
      : [...form.diasLaborales, dia]
    setForm({ ...form, diasLaborales: dias })
  }

  async function guardar(evento) {
    evento.preventDefault()
    setError("")
    setOk("")
    try {
      if (form.id) await api(`/horarios/${form.id}`, { method: "PUT", body: form })
      else await api("/horarios", { method: "POST", body: form })
      setForm({ ...NUEVO, obraId: form.obraId })
      setOk("Horario guardado.")
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  async function desactivar(horario) {
    try {
      await api(`/horarios/${horario.id}`, {
        method: "PUT",
        body: {
          obraId: horario.obra_id,
          horaEntrada: horario.hora_entrada,
          horaSalida: horario.hora_salida,
          diasLaborales: horario.dias_laborales.split(","),
          estado: horario.estado ? 0 : 1,
        },
      })
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <h1>Horarios</h1>
      {error && <p className="error">{error}</p>}
      {ok && <p className="ok">{ok}</p>}
      <form className="tarjeta formulario" onSubmit={guardar}>
        <h2>{form.id ? "Editar horario" : "Nuevo horario"}</h2>
        <label>Obra
          <select value={form.obraId} onChange={(e) => setForm({ ...form, obraId: Number(e.target.value) })}>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
          </select>
        </label>
        <div className="acciones">
          <label>Entrada<input type="time" value={form.horaEntrada} onChange={(e) => setForm({ ...form, horaEntrada: e.target.value })} required /></label>
          <label>Salida<input type="time" value={form.horaSalida} onChange={(e) => setForm({ ...form, horaSalida: e.target.value })} required /></label>
        </div>
        <div className="dias">
          {DIAS.map(([valor, nombre]) => (
            <button type="button" key={valor} className={form.diasLaborales.includes(valor) ? "chip activo" : "chip"} onClick={() => alternarDia(valor)}>{nombre}</button>
          ))}
        </div>
        <button className="btn">{form.id ? "Actualizar" : "Crear horario"}</button>
        {form.id && <button type="button" className="btn secundario" onClick={() => setForm({ ...NUEVO, obraId: form.obraId })}>Cancelar</button>}
      </form>
      <div className="tabla-contenedor">
        <table>
          <thead><tr><th>Obra</th><th>Jornada</th><th>Días</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {horarios.map((horario) => (
              <tr key={horario.id}>
                <td>{horario.obra_nombre}</td>
                <td>{horario.hora_entrada} – {horario.hora_salida}</td>
                <td>{textoDias(horario.dias_laborales)}</td>
                <td>{horario.estado ? "Vigente" : "Inactivo"}</td>
                <td className="acciones-tabla">
                  <button className="btn pequeno" onClick={() => setForm({
                    id: horario.id,
                    obraId: horario.obra_id,
                    horaEntrada: horario.hora_entrada,
                    horaSalida: horario.hora_salida,
                    diasLaborales: horario.dias_laborales.split(","),
                  })}>Editar</button>
                  <button className="btn pequeno" onClick={() => desactivar(horario)}>{horario.estado ? "Desactivar" : "Activar"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
