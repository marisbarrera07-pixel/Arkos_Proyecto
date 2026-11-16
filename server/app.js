import path from "node:path"
import fs from "node:fs"
import express from "express"
import cors from "cors"
import { fileURLToPath } from "node:url"
import { buildRouter } from "./routes.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp(db) {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use("/api", buildRouter(db))

  const dist = path.join(__dirname, "..", "client", "dist")
  if (fs.existsSync(dist)) {
    app.use(express.static(dist))
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) return next()
      res.sendFile(path.join(dist, "index.html"))
    })
  }

  app.use((error, _req, res, _next) => {
    console.error(error)
    res.status(500).json({ error: "Ocurrió un problema. Intenta de nuevo." })
  })
  return app
}
