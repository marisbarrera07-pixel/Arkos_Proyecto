import { useEffect, useState } from "react"
import { api, encolarMarcacion, sincronizarCola } from "../api.js"
import { puntualidad, textoDias } from "../formato.js"

function leerGps() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 },
    )
  })
}

export function Marcar() {
  const [obras, setObras] = useState([])
  const [aviso, setAviso] = useState("")
  const [error, setError] = useState("")
  const [ocupado, setOcupado] = useState("")

  async function cargar() {
    const datos = await api("/obras/mias")
    setObras(datos)
  }

  useEffect(() => {
    cargar().catch((err) => setError(err.message))
    const alEncolar = () => cargar().catch(() => {})
    window.addEventListener("arkos-cola", alEncolar)
    return () => window.removeEventListener("arkos-cola", alEncolar)
  }, [])

  async function marcar(obraId, tipo) {
    setOcupado(`${obraId}-${tipo}`)
    setError("")
    setAviso("")
    const ubicacionGps = await leerGps()
    const body = { obraId, tipo, ubicacionGps }
    try {
      if (!navigator.onLine) throw Object.assign(new Error("offline"), { red: true })
      const marca = await api("/asistencias/registrar", { method: "POST", body })
      setAviso(`${tipo === "ENTRADA" ? "Entrada" : "Salida"} registrada: ${puntualidad(marca.estado_horario)}.`)
      await cargar()
    } catch (err) {
      if (err.red) {
        encolarMarcacion(body)
        setAviso("Sin señal. La marcación quedó guardada en este celular y se enviará sola.")
      } else {
        setError(err.message)
      }
    } finally {
      setOcupado("")
      sincronizarCola().catch(() => {})
    }
  }

  if (!obras.length && !error) {
    return <p className="vacio">Todavía no estás asignado a una obra. Avisa al administrador.</p>
  }

  return (
    <section>
      <h1>Registrar asistencia</h1>
      <p className="ayuda">Un toque marca tu entrada o tu salida.</p>
      {aviso && <p className="ok">{aviso}</p>}
      {error && <p className="error">{error}</p>}
      <div className="rejilla">
        {obras.map((obra) => {
          const horario = obra.horarios.find((h) => h.estado)
          return (
            <article className="tarjeta" key={obra.id}>
              <h2>{obra.nombre}</h2>
              <p>{obra.ubicacion}</p>
              <p className="ayuda">
                {horario
                  ? `${textoDias(horario.dias_laborales)} · ${horario.hora_entrada} a ${horario.hora_salida}`
                  : "Esta obra aún no tiene horario."}
              </p>
              <div className="marcas-hoy">
                {obra.marcasHoy.map((marca) => (
                  <span key={marca.id}>{marca.tipo === "ENTRADA" ? "Entrada" : "Salida"} {marca.hora_registro.slice(0, 5)} · {puntualidad(marca.estado_horario)}</span>
                ))}
              </div>
              <div className="acciones">
                <button className="btn grande" disabled={ocupado === `${obra.id}-ENTRADA`} onClick={() => marcar(obra.id, "ENTRADA")}>Entrada</button>
                <button className="btn grande secundario" disabled={ocupado === `${obra.id}-SALIDA`} onClick={() => marcar(obra.id, "SALIDA")}>Salida</button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
