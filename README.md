# Sistema Arkos

Asistencia de trabajadores en obra — ACM Diseño y Construcciones SAS.

## Local

1. Copia `.env.example` a `.env`
2. Para trabajar como siempre con SQL Server / SSMS: deja `DB_CLIENT=mssql` y tus datos `DB_*`
3. `npm run install:all`
4. `npm run dev` → http://localhost:5173

## Render (gratis, solo un Web Service)

Guía: [docs/DESPLIEGUE-RENDER.md](docs/DESPLIEGUE-RENDER.md)

- Build: `npm install && npm run build`
- Start: `npm start`
- Variables: `NODE_VERSION=22`, `DB_CLIENT=sqlite`, `DB_PATH=:memory:`, `JWT_SECRET=...`
- Sin Azure ni base externa. Al reiniciar, la app vuelve a empezar con datos de prueba.

## Cuentas de prueba

| Rol | Documento | Contraseña |
|-----|-----------|------------|
| Administrador | 10000001 | Admin123* |
| Trabajador | 10000002 | Obra123* |
