import { createContext, useContext, useMemo, useState } from "react"

const AuthContext = createContext(null)
const LLAVE = "arkos_sesion"

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    try {
      const guardada = localStorage.getItem(LLAVE)
      return guardada ? JSON.parse(guardada) : null
    } catch {
      return null
    }
  })

  const valor = useMemo(() => ({
    sesion,
    entrar(datos) {
      localStorage.setItem(LLAVE, JSON.stringify(datos))
      setSesion(datos)
    },
    salir() {
      localStorage.removeItem(LLAVE)
      setSesion(null)
    },
  }), [sesion])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function tokenActual() {
  try {
    return JSON.parse(localStorage.getItem(LLAVE) || "null")?.token || ""
  } catch {
    return ""
  }
}
