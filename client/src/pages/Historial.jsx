import { useEffect, useState } from "react"
import { api } from "../api.js"
import { estadoMarca, puntualidad } from "../formato.js"
import { Modal } from "../components/Modal.jsx"

export function Historial() {
  const [filas, setFilas] = useState([])
  const [error, setError] = useState("")
  const [elegida, setElegida] = useState(null)
  const [motivo, setMotivo] = useState("")
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")

  async function cargar() {
    setFilas(await api("/asistencias/mias"))
  }

  useEffect(() => { cargar().catch((err) => setError(err.message)) }, [])

  async function pedir(evento) {
    evento.preventDefault()
    setError("")
    try {
      await api(`/asistencias/${elegida.id}/solicitar`, { method: "POST", body: { fecha, hora, motivo } })
      setElegida(null)
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <h1>Mi historial</h1>
      {error && <p className="error">{error}</p>}
      <div className="tabla-contenedor">
        <table>
          <thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Obra</th><th>Puntualidad</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.id}>
                <td>{fila.fecha}</td>
                <td>{fila.hora_registro.slice(0, 5)}</td>
                <td>{fila.tipo === "ENTRADA" ? "Entrada" : "Salida"}</td>
                <td>{fila.obra}</td>
                <td>{puntualidad(fila.estado_horario)}</td>
                <td>{estadoMarca(fila.estado)}</td>
                <td>
                  {fila.estado !== "ANULADA" && (
                    <button className="btn pequeno" onClick={() => {
                      setElegida(fila)
                      setFecha(fila.fecha)
                      setHora(fila.hora_registro.slice(0, 5))
                      setMotivo("")
                    }}>Pedir corrección</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {elegida && (
        <Modal titulo="Pedir corrección" onCerrar={() => setElegida(null)}>
          <form onSubmit={pedir} className="formulario">
            <label>Fecha<input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required /></label>
            <label>Hora<input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required /></label>
            <label>Motivo<textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} required minLength={5} /></label>
            <button className="btn">Enviar solicitud</button>
          </form>
        </Modal>
      )}
    </section>
  )
}
