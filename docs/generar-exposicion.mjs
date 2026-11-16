import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function p(texto, opciones = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    ...opciones,
    children: [
      new TextRun({
        text: texto,
        font: "Calibri",
        size: opciones.size || 22,
        bold: opciones.bold || false,
        italics: opciones.italics || false,
      }),
    ],
  })
}

function titulo(texto, nivel = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: nivel,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text: texto, font: "Calibri", bold: true, size: nivel === HeadingLevel.HEADING_1 ? 32 : 26 })],
  })
}

function viñeta(texto) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: [new TextRun({ text: `• ${texto}`, font: "Calibri", size: 22 })],
  })
}

function celda(texto, opciones = {}) {
  return new TableCell({
    width: { size: opciones.width || 2500, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    },
    shading: opciones.header ? { fill: "1C1914" } : undefined,
    children: [
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: texto,
            font: "Calibri",
            size: 18,
            bold: !!opciones.header || !!opciones.bold,
            color: opciones.header ? "FFFFFF" : "000000",
          }),
        ],
      }),
    ],
  })
}

function fila(celdas, header = false) {
  return new TableRow({
    children: celdas.map((c) =>
      typeof c === "string"
        ? celda(c, { header, width: Math.floor(9000 / celdas.length) })
        : celda(c.texto, { header, bold: c.bold, width: c.width || Math.floor(9000 / celdas.length) }),
    ),
  })
}

const doc = new Document({
  styles: {
    default: {
      document: {
        styles: [{ id: "Normal", run: { font: "Calibri", size: 22 } }],
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "SISTEMA ARKOS", font: "Calibri", bold: true, size: 40 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Asistencia de trabajadores en obra", font: "Calibri", size: 28 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "ACM Diseño y Construcciones SAS", font: "Calibri", italics: true, size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
          children: [
            new TextRun({
              text: "Documento de exposición del proyecto — explicación técnica y guion oral",
              font: "Calibri",
              size: 20,
            }),
          ],
        }),

        titulo("1. ¿Qué es la aplicación?"),
        p("Sistema Arkos es una aplicación web de asistencia de trabajadores en obra para ACM Diseño y Construcciones SAS."),
        p("Sirve para:"),
        viñeta("Que el trabajador marque entrada y salida en la obra."),
        viñeta("Que el administrador gestione personal, obras, horarios, asistencias, correcciones y auditoría."),
        viñeta("Guardar todo en una base de datos real visible en SQL Server Management Studio 22."),
        p("Este repositorio es independiente de GestionSS_OpenSpeec / Gestión SST. No se mezclan."),

        titulo("2. Arquitectura general"),
        p("Es una aplicación cliente–servidor con patrón MVC en el backend:"),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            fila(["Capa", "Tecnología", "Qué hace"], true),
            fila(["Frontend (vista)", "React 19 + Vite 7", "Pantallas en el navegador"]),
            fila(["Backend (API)", "Node.js + Express 5", "Valida, consulta y responde JSON"]),
            fila(["Base de datos", "SQL Server Express (Arkos)", "Persistencia permanente"]),
            fila(["Herramienta BD", "SSMS 22", "Ver tablas y datos"]),
          ],
        }),
        p("Flujo típico:"),
        viñeta("El usuario abre http://localhost:5173 (Vite)."),
        viñeta("React llama rutas como /api/auth/login."),
        viñeta("Vite hace proxy de /api hacia http://localhost:3000 (Express)."),
        viñeta("Express consulta SQL Server y responde JSON."),
        viñeta("React muestra el resultado en pantalla."),

        titulo("3. Programas y herramientas"),
        titulo("3.1 Desarrollo y ejecución", HeadingLevel.HEADING_2),
        viñeta("Node.js — ejecuta el servidor y las herramientas."),
        viñeta("npm — instala paquetes y corre scripts (npm run dev)."),
        viñeta("Vite — servidor de desarrollo del frontend (puerto 5173)."),
        viñeta("Express — API REST (puerto 3000)."),
        viñeta("concurrently — levanta API y web juntos con un solo comando."),

        titulo("3.2 Frontend", HeadingLevel.HEADING_2),
        viñeta("React 19 — interfaz por componentes."),
        viñeta("React Router DOM 7 — rutas (/login, /marcar, /asistencias, etc.)."),
        viñeta("CSS propio (styles.css) — diseño Arkos (amarillo obra, franjas, tipografías Outfit / Source Sans 3)."),

        titulo("3.3 Backend", HeadingLevel.HEADING_2),
        viñeta("Express 5 — rutas HTTP."),
        viñeta("mssql (Tedious) — conexión a SQL Server."),
        viñeta("jsonwebtoken (JWT) — sesión segura (token aprox. 12 horas)."),
        viñeta("bcryptjs — contraseñas hasheadas (no se guardan en texto plano)."),
        viñeta("dotenv — lee el archivo .env (puerto, JWT, datos de BD)."),
        viñeta("cors — permite que el frontend hable con la API."),

        titulo("3.4 Base de datos", HeadingLevel.HEADING_2),
        viñeta("SQL Server Express — instancia localhost\\SQLEXPRESS, puerto 1433."),
        viñeta("Base de datos: Arkos."),
        viñeta("Usuario SQL: arkos (autenticación SQL)."),
        viñeta("SQL Server Management Studio 22 — explorar tablas y datos."),

        titulo("3.5 Metodología", HeadingLevel.HEADING_2),
        viñeta("OpenSpec — se propone el cambio (/opsx-propose) y luego se implementa (/opsx-apply)."),

        titulo("4. Cómo se arranca"),
        p("En la raíz del proyecto se ejecuta:"),
        p("npm run dev", { bold: true }),
        p("Eso abre:"),
        viñeta("API: http://localhost:3000"),
        viñeta("Web: http://localhost:5173"),
        p("Configuración principal en .env: PORT, JWT_SECRET, DB_SERVER, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD."),
        p("Al arrancar, el servidor conecta a SQL Server, crea la base Arkos si no existe, crea las tablas si faltan y, si no hay usuarios, siembra cuentas de prueba."),

        titulo("5. Roles y pantallas"),
        titulo("5.1 Trabajador", HeadingLevel.HEADING_2),
        viñeta("Marcar — entrada/salida, con obra asignada y GPS si hay señal."),
        viñeta("Mi historial — ver marcas propias y pedir ajuste."),

        titulo("5.2 Administrador", HeadingLevel.HEADING_2),
        viñeta("Asistencias — reporte, filtros, registrar jornada, corregir/anular, solicitudes."),
        viñeta("Personal — crear/editar usuarios, cambiar rol, desactivar."),
        viñeta("Obras — crear/editar obras y asignar trabajadores."),
        viñeta("Horarios — horarios por obra (entrada, salida, días)."),
        viñeta("Auditoría — historial de correcciones y anulaciones."),

        p("Login (/login): pantalla partida con marca Arkos a la izquierda y formulario a la derecha (documento, contraseña, Mostrar, Entrar)."),
        p("Tras entrar: administrador va a /asistencias; trabajador va a /marcar. Las rutas están protegidas por sesión y por rol."),

        titulo("6. Base de datos — tablas"),
        p("Motor: Microsoft SQL Server. Base: Arkos. Visible en SSMS 22."),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            fila(["Tabla", "Contenido"], true),
            fila(["usuario", "Documento, nombre, correo, teléfono, cargo, hash de contraseña, rol, estado"]),
            fila(["obra", "Nombre, ubicación, fecha de inicio, estado"]),
            fila(["obra_trabajador", "Relación obra ↔ trabajador"]),
            fila(["horario", "Obra, hora entrada/salida, días laborales, estado"]),
            fila(["asistencia", "Usuario, obra, fecha, hora, ENTRADA/SALIDA, GPS, a tiempo/fuera, ACTIVA/ANULADA/CORREGIDA"]),
            fila(["auditoria", "Quién corrigió/anuló, motivo, fecha, detalle"]),
            fila(["solicitud_ajuste", "Pedido del trabajador; PENDIENTE / APROBADA / RECHAZADA"]),
          ],
        }),
        p("Cuentas de prueba si la base está vacía:"),
        viñeta("Administrador: documento 10000001 / contraseña Admin123*"),
        viñeta("Trabajador: documento 10000002 / contraseña Obra123*"),
        viñeta("Obra de ejemplo: Torres del Río, horario lunes a viernes 07:00–17:00."),

        titulo("7. APIs (todas las rutas)"),
        p("Prefijo /api. Definidas en server/routes.js."),

        titulo("7.1 Públicas", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            fila(["Método", "Ruta", "Uso"], true),
            fila(["GET", "/api/salud", "Comprobar que el servidor está activo"]),
            fila(["POST", "/api/auth/login", "Login → token JWT + usuario"]),
          ],
        }),

        titulo("7.2 Con token (usuario logueado)", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            fila(["Método", "Ruta", "Uso"], true),
            fila(["GET", "/api/obras/mias", "Obras del trabajador"]),
            fila(["POST", "/api/asistencias/registrar", "Marcar entrada/salida"]),
            fila(["GET", "/api/asistencias/mias", "Historial propio"]),
            fila(["POST", "/api/asistencias/:id/solicitar", "Pedir ajuste"]),
          ],
        }),

        titulo("7.3 Solo administrador", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            fila(["Método", "Ruta", "Uso"], true),
            fila(["GET/POST", "/api/usuarios", "Listar / crear personal"]),
            fila(["PUT/DELETE", "/api/usuarios/:id", "Editar / desactivar"]),
            fila(["PATCH", "/api/usuarios/:id/rol", "Cambiar rol"]),
            fila(["GET/POST", "/api/obras", "Listar / crear obras"]),
            fila(["PUT", "/api/obras/:id", "Actualizar obra"]),
            fila(["POST", "/api/obras/:id/asignar-trabajadores", "Asignar personal"]),
            fila(["GET/POST", "/api/horarios", "Listar / crear horarios"]),
            fila(["PUT", "/api/horarios/:id", "Actualizar horario"]),
            fila(["POST", "/api/asistencias/jornada", "Registrar jornada (admin)"]),
            fila(["GET", "/api/asistencias/jornadas", "Historial de jornadas"]),
            fila(["GET", "/api/asistencias/reporte", "Reporte / filtros / CSV"]),
            fila(["GET", "/api/asistencias/solicitudes", "Solicitudes pendientes"]),
            fila(["POST", "/api/asistencias/solicitudes/:id/:decision", "Aprobar o rechazar"]),
            fila(["PUT", "/api/asistencias/:id/corregir", "Corregir marca"]),
            fila(["PATCH", "/api/asistencias/:id/anular", "Anular marca"]),
            fila(["GET", "/api/auditoria", "Listado de auditoría"]),
          ],
        }),
        p("Seguridad: casi todo exige Bearer JWT. Rutas de admin pasan por verificarRol(ADMINISTRADOR). Contraseñas con bcrypt."),

        titulo("8. Lógica de negocio importante"),
        viñeta("Horario: al marcar se valida contra el horario de la obra → A_TIEMPO o FUERA_DE_HORARIO."),
        viñeta("Zona horaria: fecha y hora con lógica de Bogotá."),
        viñeta("Offline: si no hay red al marcar, se guarda en localStorage y se sincroniza al volver internet."),
        viñeta("GPS: al marcar se intenta leer la ubicación del navegador."),
        viñeta("Auditoría: correcciones y anulaciones dejan rastro (quién, motivo, cuándo)."),

        titulo("9. Estructura de carpetas"),
        p("appproyectodeaulas/"),
        viñeta("client/ — Frontend React + Vite (pages, components, api.js, auth.jsx, styles.css)"),
        viñeta("server/ — Backend Express (index, app, routes, db, middleware, controllers, services)"),
        viñeta("tests/flujo.mjs — Prueba de flujo"),
        viñeta("openspec/ — Propuestas y especificaciones de cambios"),
        viñeta(".env — Configuración local (no subir secretos)"),
        viñeta("package.json — Scripts y dependencias del proyecto"),

        titulo("10. Frase de cierre"),
        p(
          "“Arkos es una aplicación web full-stack: React en el navegador, API REST en Node/Express, autenticación JWT, contraseñas con bcrypt, y persistencia en SQL Server Express administrada con SSMS 22. Permite marcar asistencia en obra, gestionar personal y horarios, y dejar trazabilidad con auditoría y solicitudes de ajuste.”",
          { italics: true },
        ),

        titulo("11. Guion de exposición (3 a 5 minutos)"),
        p("Usa este guion casi palabra por palabra. Entre paréntesis van las acciones (mostrar pantalla, SSMS, etc.)."),

        titulo("Minuto 0–0:40 — Presentación", HeadingLevel.HEADING_2),
        p("“Buenos días / buenas tardes. Mi proyecto se llama Sistema Arkos. Es una aplicación web de asistencia de trabajadores en obra para ACM Diseño y Construcciones SAS. El objetivo es que el personal marque entrada y salida, y que el administrador controle obras, horarios y el historial de asistencia.”"),

        titulo("Minuto 0:40–1:20 — Arquitectura", HeadingLevel.HEADING_2),
        p("“La arquitectura es cliente–servidor. En el navegador uso React con Vite. En el servidor uso Node.js con Express. La base de datos es SQL Server Express, y la reviso con SQL Server Management Studio 22. El frontend corre en el puerto 5173 y la API en el 3000; Vite reenvía las peticiones /api al backend.”"),
        p("(Mostrar diagrama o carpetas client / server.)"),

        titulo("Minuto 1:20–2:00 — Login y seguridad", HeadingLevel.HEADING_2),
        p("“Para entrar, el usuario escribe documento y contraseña. (Abrir /login.) La autenticación usa JWT: el servidor entrega un token y el cliente lo guarda para las siguientes peticiones. Las contraseñas no se guardan en texto plano: van hasheadas con bcrypt. Hay dos roles: administrador y trabajador, y cada uno ve menús distintos.”"),

        titulo("Minuto 2:00–3:00 — Demo trabajador", HeadingLevel.HEADING_2),
        p("“Entro como trabajador. (Login 10000002 / Obra123*.) Aquí está Marcar: elijo la obra y registro entrada o salida. El sistema valida el horario y puede capturar GPS. También hay cola offline: si no hay internet, la marcación se guarda y se envía después. En Mi historial veo mis marcas y puedo pedir un ajuste.”"),

        titulo("Minuto 3:00–4:00 — Demo administrador", HeadingLevel.HEADING_2),
        p("“Ahora entro como administrador. (Login 10000001 / Admin123*.) En Personal creo y edito usuarios. En Obras creo obras y asigno trabajadores. En Horarios defino días y horas. En Asistencias filtro el reporte, registro jornadas, corrijo o anulo marcas y resuelvo solicitudes. En Auditoría queda el rastro de quién cambió qué y por qué.”"),

        titulo("Minuto 4:00–4:40 — Base de datos y APIs", HeadingLevel.HEADING_2),
        p("“Todo se guarda en la base Arkos de SQL Server. (Abrir SSMS → Bases de datos → Arkos → Tablas.) Hay tablas de usuario, obra, horario, asistencia, auditoría y solicitud de ajuste. La API REST está en Express: por ejemplo POST /api/auth/login, POST /api/asistencias/registrar, y rutas de admin para usuarios, obras y reportes. Casi todas exigen el token JWT.”"),

        titulo("Minuto 4:40–5:00 — Cierre", HeadingLevel.HEADING_2),
        p("“En resumen: Arkos es una solución full-stack real, con frontend React, backend Express, seguridad JWT y bcrypt, y persistencia en SQL Server visible en SSMS 22. Resuelve la asistencia en obra con control, trazabilidad y roles diferenciados. Gracias. ¿Preguntas?”"),

        titulo("12. Tips para la exposición"),
        viñeta("Ten npm run dev ya corriendo antes de empezar."),
        viñeta("Ten SSMS abierto en la base Arkos."),
        viñeta("Practica el login de las dos cuentas una vez antes."),
        viñeta("Si preguntan por OpenSpec: es la forma en que documentamos cambios (propuesta → diseño → tareas → implementación)."),
        viñeta("Si preguntan por offline: localStorage + sincronización al recuperar red."),
        viñeta("No leas el documento completo: usa el guion; este Word es tu respaldo."),
      ],
    },
  ],
})

const salida = path.join(__dirname, "Exposicion-Sistema-Arkos.docx")
const buffer = await Packer.toBuffer(doc)
fs.writeFileSync(salida, buffer)
console.log(`Documento creado: ${salida}`)
