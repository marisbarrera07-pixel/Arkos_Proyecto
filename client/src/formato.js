const DIAS = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 0: "Dom" }

export function textoDias(csv = "") {
  return csv.split(",").filter(Boolean).map((dia) => DIAS[dia] || dia).join(", ")
}

export function puntualidad(estado) {
  if (estado === "A_TIEMPO") return "A tiempo"
  if (estado === "FUERA_DE_HORARIO") return "Fuera de horario"
  return estado
}

export function estadoMarca(estado) {
  if (estado === "ACTIVA") return "Activa"
  if (estado === "ANULADA") return "Anulada"
  if (estado === "CORREGIDA") return "Corregida"
  return estado
}
