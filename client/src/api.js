import { tokenActual } from "./auth.jsx"

const COLA = "arkos_cola_offline"

export function leerCola() {
  try {
    return JSON.parse(localStorage.getItem(COLA) || "[]")
  } catch {
    return []
  }
}

function guardarCola(cola) {
  localStorage.setItem(COLA, JSON.stringify(cola))
  window.dispatchEvent(new Event("arkos-cola"))
}

export async function api(path, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`/api${path}`, {
      method: opciones.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: tokenActual() ? `Bearer ${tokenActual()}` : "",
      },
      body: opciones.body ? JSON.stringify(opciones.body) : undefined,
    })
  } catch {
    const error = new Error("No hay conexión con el servidor.")
    error.red = true
    throw error
  }
  if (respuesta.status === 401) {
    localStorage.removeItem("arkos_sesion")
    if (!path.startsWith("/auth/")) window.location.href = "/login"
  }
  const texto = await respuesta.text()
  let datos = null
  try {
    datos = texto ? JSON.parse(texto) : null
  } catch {
    datos = null
  }
  if (!respuesta.ok) {
    const mensaje = datos?.error
      || (respuesta.status >= 500
        ? "No hay conexión con el servidor. Espera un momento e intenta de nuevo."
        : "No se pudo completar la acción.")
    const error = new Error(mensaje)
    error.status = respuesta.status
    throw error
  }
  return datos
}

export function encolarMarcacion(body) {
  const cola = leerCola()
  cola.push({ ...body, offline: true, fechaHora: new Date().toISOString(), idLocal: crypto.randomUUID() })
  guardarCola(cola)
}

export async function sincronizarCola() {
  const cola = leerCola()
  if (!cola.length || !navigator.onLine) return
  const restantes = []
  let sinRed = false
  for (const item of cola) {
    if (sinRed) {
      restantes.push(item)
      continue
    }
    try {
      await api("/asistencias/registrar", { method: "POST", body: item })
    } catch (error) {
      if (error.status === 409) continue
      restantes.push(item)
      if (error.red || !error.status) sinRed = true
    }
  }
  guardarCola(restantes)
}

export async function descargarCsv(query) {
  const respuesta = await fetch(`/api/asistencias/reporte?${query}&formato=csv`, {
    headers: { Authorization: `Bearer ${tokenActual()}` },
  })
  if (!respuesta.ok) throw new Error("No se pudo exportar el Excel.")
  const blob = await respuesta.blob()
  const enlace = document.createElement("a")
  enlace.href = URL.createObjectURL(blob)
  enlace.download = "asistencias-arkos.csv"
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}
