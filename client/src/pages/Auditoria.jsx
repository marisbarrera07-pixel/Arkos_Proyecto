import { useEffect, useState } from "react"
import { api } from "../api.js"

export function Auditoria() {
  const [filas, setFilas] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    api("/auditoria").then(setFilas).catch((err) => setError(err.message))
  }, [])

  return (
    <section>
      <h1>Auditoría</h1>
      <p className="ayuda">Cada corrección o anulación queda con el responsable, la fecha y el motivo.</p>
      {error && <p className="error">{error}</p>}
      <div className="tabla-contenedor">
        <table>
          <thead><tr><th>Cuándo</th><th>Acción</th><th>Responsable</th><th>Obra</th><th>Motivo</th><th>Detalle</th></tr></thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.id}>
                <td>{fila.fecha}</td>
                <td>{fila.accion === "CORRECCION" ? "Corrección" : "Anulación"}</td>
                <td>{fila.responsable}</td>
                <td>{fila.obra}</td>
                <td>{fila.motivo}</td>
                <td>{fila.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filas.length === 0 && !error && <p className="vacio">Todavía no hay correcciones ni anulaciones.</p>}
    </section>
  )
}
