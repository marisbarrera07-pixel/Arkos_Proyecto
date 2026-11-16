import "dotenv/config"
import { createApp } from "./app.js"
import { openDb } from "./db.js"

if (!process.env.JWT_SECRET) {
  console.error("Falta JWT_SECRET en el archivo .env")
  process.exit(1)
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

while (true) {
  try {
    const db = await openDb()
    const port = Number(process.env.PORT) || 3000
    createApp(db).listen(port, () => {
      console.log(`Sistema Arkos listo en http://localhost:${port}`)
    })
    break
  } catch (error) {
    console.error(error.message || error)
    console.error("Reintentando conexión a SQL Server en 5 segundos...")
    await esperar(5000)
  }
}
