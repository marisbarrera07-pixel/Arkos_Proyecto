import { aMinutos, diaDeFecha } from "../time.js"

export function estaDentroDelRango(hora, entrada, salida) {
  const marca = aMinutos(hora)
  return marca >= aMinutos(entrada) && marca <= aMinutos(salida)
}

export async function validarHorario(db, obraId, fecha, hora) {
  const horarios = await db.prepare(
    "SELECT * FROM horario WHERE obra_id = ? AND estado = 1 ORDER BY id",
  ).all(obraId)
  const dia = diaDeFecha(fecha)
  const delDia = horarios.filter((h) => h.dias_laborales.split(",").includes(String(dia)))
  const coincide = delDia.find((h) => estaDentroDelRango(hora, h.hora_entrada, h.hora_salida))
  if (coincide) {
    return { horarioId: coincide.id, estadoHorario: "A_TIEMPO" }
  }
  const referencia = delDia[0] || horarios[0] || null
  return {
    horarioId: referencia ? referencia.id : null,
    estadoHorario: "FUERA_DE_HORARIO",
  }
}
