## Why

Hoy los datos de Arkos viven en un archivo SQLite (`data/arkos.sqlite`) que no se abre en SQL Server Management Studio 22. Para ver usuarios, obras y asistencias en SSMS, la aplicación debe guardar todo en SQL Server.

## What Changes

- **BREAKING**: la API deja de usar SQLite y pasa a SQL Server.
- Se crea la base `Arkos` con las mismas tablas: usuario, obra, obra_trabajador, horario, asistencia, auditoria y solicitud_ajuste.
- El `.env` guarda servidor, base, usuario y contraseña de SQL Server, en lugar de `DB_PATH`.
- La app sigue creando las tablas y las cuentas de prueba si la base está vacía.
- En SSMS 22 se pueden ver y consultar esas tablas con una conexión local.
- Las pruebas automáticas usan SQL Server local o una instancia de prueba, no un archivo `.sqlite`.

## Capabilities

### New Capabilities

- `persistencia-sql-server`: Conexión de Arkos a SQL Server y visibilidad de los datos en SQL Server Management Studio 22.

### Modified Capabilities

- Ninguna. `openspec/specs/` no tiene especificaciones previas archivadas.

## Impact

- `server/db.js` y todos los controladores que hoy usan `db.prepare` de SQLite.
- `server/index.js`, `.env` y `.env.example`.
- `tests/flujo.mjs`.
- Dependencia nueva: `mssql`.
- Requiere SQL Server instalado y SQL Server Management Studio 22 para abrir la base `Arkos`.
