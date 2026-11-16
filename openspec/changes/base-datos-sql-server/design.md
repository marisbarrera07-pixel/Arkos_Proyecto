## Context

Arkos guarda usuarios, obras, horarios y asistencias en SQLite (`data/arkos.sqlite`) con `node:sqlite`. Las consultas son síncronas (`db.prepare().get/all/run`). SQL Server Management Studio 22 no abre ese archivo: espera un servidor SQL Server. En el equipo ya está SSMS 22; la app debe hablar con esa instancia.

## Goals / Non-Goals

**Goals:**

- Persistir los mismos datos en SQL Server, visibles en SSMS 22 como base `Arkos`.
- Crear tablas y cuentas de prueba al arrancar si la base está vacía.
- Configurar servidor, base y credenciales en `.env`.
- Mantener el comportamiento de login, personal, obras, horarios y asistencias.

**Non-Goals:**

- No dejar SQLite como alternativa.
- No copiar automáticamente el `.sqlite` actual a SQL Server. Tras el cambio, se siembran las cuentas de prueba; los datos de aula se vuelven a cargar en la app o se insertan en SSMS.
- No desplegar SQL Server en la nube.

## Decisions

1. **Motor: SQL Server local, base `Arkos`.** SSMS 22 se conecta a `localhost` (o `localhost\SQLEXPRESS`) y muestra `Arkos`. Alternativa descartada: seguir con SQLite y un visor aparte, porque no cumple el pedido de verla en SSMS.

2. **Driver `mssql` (Tedious) con autenticación SQL.** El `.env` tendrá `DB_SERVER`, `DB_NAME=Arkos`, `DB_USER`, `DB_PASSWORD`, `DB_ENCRYPT=false` y `DB_TRUST_CERT=true` para la instancia local. Alternativa: autenticación de Windows con `msnodesqlv8`; se deja fuera en este cambio para no complicar Node. En SSMS se crea un inicio de sesión y un usuario de la base `Arkos`.

3. **Capa de acceso async con los mismos `prepare/get/all/run`.** Los controladores pasan a `await`. Un adaptador traduce `?` a parámetros `@p0`, `@p1`, y en los INSERT usa `OUTPUT INSERTED.id` para reemplazar `lastInsertRowid`. Las transacciones `BEGIN/COMMIT/ROLLBACK` pasan a transacción de `mssql`. Así no se reescribe la lógica de negocio.

4. **Tipos T-SQL equivalentes.** `INTEGER PRIMARY KEY AUTOINCREMENT` → `INT IDENTITY(1,1) PRIMARY KEY`. `TEXT` → `NVARCHAR`. `CHECK` de rol, tipo y estado se mantienen. Las llaves foráneas quedan igual.

5. **Arranque: conectar a `master`, crear `Arkos` si no existe, luego tablas y semilla.** Si no hay usuarios, se insertan Ana Ríos y Luis Cárdenas, la obra Torres del Río y el horario de lunes a viernes.

## Risks / Trade-offs

- [La instancia no es `localhost` sino `localhost\SQLEXPRESS`] → `DB_SERVER` en `.env` se documenta para ambos casos.
- [SQL Server o el servicio no están encendidos] → al arrancar, la API muestra un error claro: no se pudo conectar; hay que abrir SSMS y confirmar que el servicio está en ejecución.
- [Los datos actuales de SQLite no pasan solos] → se avisa al aplicar el cambio. Quien necesite el historial viejo lo exporta antes o lo carga de nuevo.
- [Las pruebas necesitan SQL Server] → `tests/flujo.mjs` usa una base `ArkosTest` o la misma instancia con tablas temporales; no se vuelve a SQLite.

## Migration Plan

1. Tener SQL Server en ejecución y SSMS 22 instalado.
2. Crear en SSMS un login de SQL (por ejemplo `arkos`) con permiso para crear bases, o usar `sa` solo en local.
3. Poner esas credenciales en `.env`.
4. Arrancar la API: crea `Arkos`, las tablas y la semilla.
5. En SSMS: conectar al servidor → Bases de datos → `Arkos` → Tablas.

Rollback: volver `server/db.js` a SQLite y `DB_PATH`; el archivo viejo puede seguir en `data/` si no se borró.

## Open Questions

Ninguna bloqueante. Si al aplicar no hay instancia, se usa `localhost` y se ajusta `DB_SERVER` según lo que muestre SSMS en "Connect to Server".
