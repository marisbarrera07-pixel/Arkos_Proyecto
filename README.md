# Sistema Arkos

Asistencia de trabajadores en obra — ACM Diseño y Construcciones SAS.

## Local

1. Copia `.env.example` a `.env` y configura SQL Server Express.
2. `npm run install:all`
3. `npm run dev` → web en http://localhost:5173 · API en http://localhost:3000

## Render

Guía completa: [docs/DESPLIEGUE-RENDER.md](docs/DESPLIEGUE-RENDER.md)

- **Build:** `npm install && npm run build`
- **Start:** `npm start`
- Base de datos: Azure SQL (Render no ofrece SQL Server)

## Cuentas de prueba

| Rol | Documento | Contraseña |
|-----|-----------|------------|
| Administrador | 10000001 | Admin123* |
| Trabajador | 10000002 | Obra123* |
