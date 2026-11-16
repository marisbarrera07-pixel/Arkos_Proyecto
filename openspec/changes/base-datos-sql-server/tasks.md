## 1. Conexión y esquema

- [x] 1.1 Agregar la dependencia `mssql` y reemplazar `DB_PATH` en `.env` y `.env.example` por `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ENCRYPT` y `DB_TRUST_CERT`
- [x] 1.2 Reescribir `server/db.js` para conectar a SQL Server, crear la base `Arkos` si no existe y crear las tablas en T-SQL
- [x] 1.3 Conservar la semilla de administrador, trabajador, obra y horario cuando `usuario` esté vacía
- [x] 1.4 Exponer un adaptador async `prepare/get/all/run` y transacciones, con `OUTPUT INSERTED.id` en los INSERT

## 2. API sobre SQL Server

- [x] 2.1 Actualizar `server/index.js` para abrir la conexión async y fallar con un mensaje claro si SQL Server no responde
- [x] 2.2 Convertir a `await` los controladores y el middleware que hoy usan `db.prepare` de SQLite
- [x] 2.3 Quitar el uso de `node:sqlite` en la aplicación

## 3. Prueba y visibilidad en SSMS

- [x] 3.1 Ajustar `tests/flujo.mjs` para usar SQL Server y comprobar login, alta de trabajador y consulta de jornadas
- [x] 3.2 Ejecutar `npm test` contra la instancia local
- [x] 3.3 Documentar en un comentario del `.env.example` cómo abrir `Arkos` en SQL Server Management Studio 22
