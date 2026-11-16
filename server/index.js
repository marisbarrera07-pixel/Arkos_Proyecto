import "dotenv/config"
import { createApp } from "./app.js"
import { openDb } from "./db.js"

if (!process.env.JWT_SECRET) {
  console.error("Falta JWT_SECRET. Configúralo en .env o en las variables de entorno de Render.")
  process.exit(1)
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const port = Number(process.env.PORT) || 3000
const host = process.env.HOST || "0.0.0.0"

while (true) {
  try {
    const db = await openDb()
    createApp(db).listen(port, host, () => {
      console.log(`Sistema Arkos listo en http://${host}:${port}`)
    })
    break
  } catch (error) {
    console.error(error.message || error)
    console.error("Reintentando conexión a SQL Server en 5 segundos...")
    await esperar(5000)
  }
}
