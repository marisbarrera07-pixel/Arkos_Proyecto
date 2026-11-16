import { useEffect, useState } from "react"
import { api, descargarCsv } from "../api.js"
import { estadoMarca, puntualidad } from "../formato.js"
import { Modal } from "../components/Modal.jsx"

export function Asistencias() {
  const [filas, setFilas] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [obras, setObras] = useState([])
  const [personal, setPersonal] = useState([])
  const vacio = { desde: "", hasta: "", obraId: "", trabajadorId: "" }
  const [filtros, setFiltros] = useState(vacio)
  const [aplicados, setAplicados] = useState(vacio)
  const [filtrando, setFiltrando] = useState(false)
  const [consultado, setConsultado] = useState(false)
  const [error, setError] = useState("")
  const [ajuste, setAjuste] = useState(null)
  const [registroAbierto, setRegistroAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorRegistro, setErrorRegistro] = useState("")
  const [jornadas, setJornadas] = useState([])
  const [jornada, setJornada] = useState({ usuarioId: "", obraId: "", fecha: "", horaIngreso: "", horaSalida: "" })

  function consultaDe(criterios) {
    const params = new URLSearchParams()
    Object.entries(criterios).forEach(([clave, valor]) => {
      if (valor) params.set(clave, valor)
    })
    return params
  }

  async function cargar(criterios, { filtrar = false } = {}) {
    if (filtrar) setFiltrando(true)
    setError("")
    try {
      const [reporte, pendientes, listaObras, gente, historial] = await Promise.all([
        api(`/asistencias/reporte?${consultaDe(criterios)}`),
        api("/asistencias/solicitudes"),
        api("/obras"),
        api("/usuarios?page=todas&incluirInactivos=1"),
        api("/asistencias/jornadas"),
      ])
      setFilas(reporte)
      setJornadas(historial)
      setAplicados(criterios)
      setConsultado(true)
      setSolicitudes(pendientes)
      setObras(listaObras)
      setPersonal(gente.filas)
    } catch (err) {
      setError(err.message)
    } finally {
      if (filtrar) setFiltrando(false)
    }
  }

  useEffect(() => { cargar(vacio) }, [])

  async function aplicar(evento) {
    evento.preventDefault()
    setError("")
    try {
      if (ajuste.modo === "anular") {
        await api(`/asistencias/${ajuste.id}/anular`, { method: "PATCH", body: { motivo: ajuste.motivo } })
      } else {
        await api(`/asistencias/${ajuste.id}/corregir`, {
          method: "PUT",
          body: { fecha: ajuste.fecha, hora: ajuste.hora, motivo: ajuste.motivo },
        })
      }
      setAjuste(null)
      await cargar(aplicados)
    } catch (err) {
      setError(err.message)
    }
  }

  async function guardarJornada(evento) {
    evento.preventDefault()
    setErrorRegistro("")
    setGuardando(true)
    try {
      await api("/asistencias/jornada", { method: "POST", body: jornada })
      setJornada({ usuarioId: "", obraId: "", fecha: "", horaIngreso: "", horaSalida: "" })
      setRegistroAbierto(false)
      await cargar(aplicados)
    } catch (err) {
      setErrorRegistro(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function filtrar(evento) {
    evento.preventDefault()
    await cargar(filtros, { filtrar: true })
  }

  async function resolver(id, decision) {
    const motivo = decision === "rechazar" ? prompt("Motivo del rechazo") : ""
    if (decision === "rechazar" && motivo === null) return
    try {
      await api(`/asistencias/solicitudes/${id}/${decision}`, { method: "POST", body: { motivo } })
      await cargar(aplicados)
    } catch (err) {
      setError(err.message)
    }
  }

  function imprimir() {
    const ventana = window.open("", "_blank")
    const cuerpo = filas.map((fila) => `<tr><td>${fila.fecha}</td><td>${fila.hora_registro}</td><td>${fila.tipo}</td><td>${fila.trabajador}</td><td>${fila.obra}</td><td>${puntualidad(fila.estado_horario)}</td><td>${estadoMarca(fila.estado)}</td></tr>`).join("")
    ventana.document.write(`<!doctype html><html><head><title>Asistencias Arkos</title><style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;font-size:12px}</style></head><body><h1>Historial de asistencia — Arkos</h1><table><thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Trabajador</th><th>Obra</th><th>Puntualidad</th><th>Estado</th></tr></thead><tbody>${cuerpo}</tbody></table></body></html>`)
    ventana.document.close()
    ventana.focus()
    ventana.print()
  }

  return (
    <section>
      <div className="encabezado">
        <h1>Asistencias</h1>
        <div className="acciones">
          <button className="btn" type="button" onClick={() => { setRegistroAbierto((abierto) => !abierto); setErrorRegistro("") }}>Registrar asistencia</button>
          <button className="btn secundario" onClick={() => descargarCsv(consultaDe(aplicados)).catch((err) => setError(err.message))}>Exportar Excel</button>
          <button className="btn secundario" onClick={imprimir}>Exportar PDF</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {registroAbierto && (
        <form className="tarjeta formulario" onSubmit={guardarJornada}>
          <h2>Registrar asistencia</h2>
          <label>Persona
            <select value={jornada.usuarioId} onChange={(e) => setJornada({ ...jornada, usuarioId: e.target.value })} required>
              <option value="">Elige a la persona</option>
              {personal.map((persona) => <option key={persona.id} value={persona.id}>{persona.nombre}</option>)}
            </select>
          </label>
          <label>Obra
            <select value={jornada.obraId} onChange={(e) => setJornada({ ...jornada, obraId: e.target.value })} required>
              <option value="">Elige la obra</option>
              {obras.filter((obra) => obra.estado).map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
            </select>
          </label>
          <div className="columnas-jornada">
            <label>Fecha<input type="date" value={jornada.fecha} onChange={(e) => setJornada({ ...jornada, fecha: e.target.value })} required /></label>
            <div className="formulario">
              <label>Hora de ingreso<input type="time" value={jornada.horaIngreso} onChange={(e) => setJornada({ ...jornada, horaIngreso: e.target.value })} required /></label>
              <label>Hora de salida<input type="time" value={jornada.horaSalida} onChange={(e) => setJornada({ ...jornada, horaSalida: e.target.value })} /></label>
            </div>
          </div>
          {errorRegistro && <p className="error">{errorRegistro}</p>}
          <button className="btn" type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar jornada"}</button>
        </form>
      )}
      <h2>Historial</h2>
      <div className="tabla-contenedor">
        <table>
          <thead><tr><th>Fecha</th><th>Hora de ingreso</th><th>Cargo</th><th>Obra</th><th>Puntualidad</th><th>Estado</th></tr></thead>
          <tbody>
            {jornadas.map((fila) => (
              <tr key={`${fila.usuarioId}-${fila.obraId}-${fila.fechaIngreso}`}>
                <td>{fila.fechaIngreso}</td>
                <td>{fila.horaIngreso.slice(0, 5)}</td>
                <td>{fila.cargo}</td>
                <td>{fila.obra}</td>
                <td>{fila.estadoHorario === "A_TIEMPO" ? "Puntual" : "Fuera de horario"}</td>
                <td>{fila.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {jornadas.length === 0 && <p className="vacio">Todavía no hay jornadas registradas.</p>}
      <form className="filtros" onSubmit={filtrar}>
        <input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
        <input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
        <select value={filtros.obraId} onChange={(e) => setFiltros({ ...filtros, obraId: e.target.value })}>
          <option value="">Todas las obras</option>
          {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
        </select>
        <select value={filtros.trabajadorId} onChange={(e) => setFiltros({ ...filtros, trabajadorId: e.target.value })}>
          <option value="">Todo el personal</option>
          {personal.map((persona) => <option key={persona.id} value={persona.id}>{persona.nombre}</option>)}
        </select>
        <button className="btn" type="submit" disabled={filtrando}>{filtrando ? "Filtrando..." : "Filtrar"}</button>
      </form>
      {solicitudes.length > 0 && (
        <div className="tarjeta">
          <h2>Solicitudes por aprobar</h2>
          {solicitudes.map((solicitud) => (
            <div className="solicitud" key={solicitud.id}>
              <p>{solicitud.solicitante} pide cambiar la {solicitud.tipo.toLowerCase()} del {solicitud.fecha} {solicitud.hora_registro.slice(0, 5)} en {solicitud.obra} a {solicitud.fecha_propuesta} {solicitud.hora_propuesta}.</p>
              <p className="ayuda">{solicitud.motivo}</p>
              <div className="acciones">
                <button className="btn pequeno" onClick={() => resolver(solicitud.id, "aprobar")}>Aprobar</button>
                <button className="btn pequeno peligro" onClick={() => resolver(solicitud.id, "rechazar")}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="tabla-contenedor">
        <table>
          <thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Trabajador</th><th>Obra</th><th>Puntualidad</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.id}>
                <td>{fila.fecha}</td>
                <td>{fila.hora_registro.slice(0, 5)}</td>
                <td>{fila.tipo === "ENTRADA" ? "Entrada" : "Salida"}</td>
                <td>{fila.trabajador}</td>
                <td>{fila.obra}</td>
                <td>{puntualidad(fila.estado_horario)}</td>
                <td>{estadoMarca(fila.estado)}</td>
                <td className="acciones-tabla">
                  {fila.estado !== "ANULADA" && (
                    <>
                      <button className="btn pequeno" onClick={() => setAjuste({ modo: "corregir", id: fila.id, fecha: fila.fecha, hora: fila.hora_registro.slice(0, 5), motivo: "" })}>Corregir</button>
                      <button className="btn pequeno peligro" onClick={() => setAjuste({ modo: "anular", id: fila.id, motivo: "" })}>Anular</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {consultado && filas.length === 0 && <p className="vacio">No hay marcaciones con esos criterios.</p>}
      {ajuste && (
        <Modal titulo={ajuste.modo === "anular" ? "Anular marcación" : "Corregir marcación"} onCerrar={() => setAjuste(null)}>
          <form onSubmit={aplicar} className="formulario">
            {ajuste.modo === "corregir" && (
              <>
                <label>Fecha<input type="date" value={ajuste.fecha} onChange={(e) => setAjuste({ ...ajuste, fecha: e.target.value })} required /></label>
                <label>Hora<input type="time" value={ajuste.hora} onChange={(e) => setAjuste({ ...ajuste, hora: e.target.value })} required /></label>
              </>
            )}
            <label>Motivo<textarea value={ajuste.motivo} onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })} required minLength={5} /></label>
            <button className="btn">Confirmar</button>
          </form>
        </Modal>
      )}
    </section>
  )
}
