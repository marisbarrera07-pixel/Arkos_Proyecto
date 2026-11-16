export function partesBogota(date = new Date()) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  })
  const map = Object.fromEntries(
    dtf.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  )
  const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    fecha: `${map.year}-${map.month}-${map.day}`,
    hora: `${map.hour}:${map.minute}:${map.second}`,
    dia: dias[map.weekday],
  }
}

export function diaDeFecha(fecha) {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function aMinutos(hora) {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}
