## ADDED Requirements

### Requirement: Persistir en SQL Server
El sistema MUST guardar usuarios, obras, horarios y asistencias en SQL Server, en una base llamada `Arkos`, y MUST dejar de usar el archivo SQLite como almacén de la aplicación.

#### Scenario: Arranque con SQL Server disponible
- **WHEN** la API inicia con un servidor SQL Server accesible y las credenciales del `.env`
- **THEN** se conecta a la base `Arkos` y, si no existía, la crea junto con las tablas de usuario, obra, obra_trabajador, horario, asistencia, auditoria y solicitud_ajuste

#### Scenario: Semilla cuando la base está vacía
- **WHEN** la base `Arkos` no tiene usuarios
- **THEN** el sistema inserta las cuentas de prueba de administrador y trabajador, la obra de ejemplo y su horario

#### Scenario: Datos visibles en SSMS 22
- **WHEN** una persona se conecta con SQL Server Management Studio 22 al mismo servidor y abre la base `Arkos`
- **THEN** puede ver las tablas y las filas creadas por la aplicación, incluido un trabajador recién registrado

### Requirement: Configuración de conexión
El sistema MUST leer servidor, nombre de base, usuario y contraseña desde variables de entorno, sin guardar secretos en el código.

#### Scenario: Conexión según el entorno
- **WHEN** el `.env` indica servidor, base `Arkos` y credenciales de SQL
- **THEN** la API usa esos valores para autenticarse en SQL Server

#### Scenario: Fallo de conexión
- **WHEN** SQL Server no responde o las credenciales son incorrectas
- **THEN** la API no arranca en silencio y muestra que no pudo conectar con SQL Server

### Requirement: Mismos flujos sobre SQL Server
El sistema MUST seguir permitiendo iniciar sesión, registrar personal y consultar asistencias usando los datos de SQL Server.

#### Scenario: Login con usuario guardado en SQL Server
- **WHEN** el administrador o el trabajador inicia sesión con documento y contraseña que existen en la tabla `usuario` de `Arkos`
- **THEN** el sistema acepta la sesión igual que antes

#### Scenario: Alta de trabajador en SQL Server
- **WHEN** el administrador registra un trabajador nuevo
- **THEN** esa fila queda en la tabla `usuario` de `Arkos` y se puede consultar desde SSMS 22
