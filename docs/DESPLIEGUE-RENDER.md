# Desplegar Sistema Arkos en Render

Render hospeda la **web + API** (Node). **No incluye SQL Server**.  
La base de datos debe estar en **Azure SQL** (u otro SQL Server en la nube). Luego puedes verla también con **SSMS 22**.

---

## Parte A — Base de datos en Azure SQL (hazlo primero)

1. Entra a [https://portal.azure.com](https://portal.azure.com) (cuenta gratuita o estudiante).
2. Busca **SQL databases** → **Create**.
3. Completa:
   - **Database name:** `Arkos`
   - **Server:** Create new  
     - Server name: algo único, ej. `arkos-mariana`  
     - Admin login: ej. `arkosadmin`  
     - Password: una contraseña fuerte (guárdala)
   - **Want to use SQL elastic pool?** No  
   - **Compute + storage:** Basic o Free si aparece
4. En **Networking**:
   - Activa **Allow Azure services and resources to access this server**
   - (Opcional) agrega tu IP para conectar con SSMS desde tu PC
5. Crea la base y espera a que termine.
6. Anota:
   - **DB_SERVER:** `arkos-mariana.database.windows.net` (el tuyo)
   - **DB_NAME:** `Arkos`
   - **DB_USER:** `arkosadmin` (el tuyo)
   - **DB_PASSWORD:** la que elegiste

Al arrancar, Arkos crea las tablas y las cuentas de prueba si la base está vacía.

**Probar en SSMS 22:** Connect → Server name = tu servidor Azure → SQL Authentication → usuario/contraseña → Bases de datos → `Arkos`.

---

## Parte B — Desplegar en Render (paso a paso)

### 1. Entra a Render
1. Abre [https://dashboard.render.com](https://dashboard.render.com)
2. Inicia sesión (con GitHub es lo más fácil)
3. Autoriza el acceso al repo `marisbarrera07-pixel/Arkos_Proyecto` si te lo pide

### 2. Crea el Web Service
1. Pulsa **New +** → **Web Service**
2. Conecta el repositorio: **Arkos_Proyecto**
3. Configura así:

| Campo | Valor |
|--------|--------|
| **Name** | `arkos` (o el que quieras) |
| **Region** | Oregon (o la más cercana) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance type** | Free |

4. Pulsa **Advanced** si quieres, o sigue a Environment.

### 3. Variables de entorno (Environment)
En **Environment** agrega exactamente estas:

| Key | Value |
|-----|--------|
| `NODE_VERSION` | `20` |
| `JWT_SECRET` | una frase larga al azar (ej. genera una en [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)) |
| `DB_SERVER` | `tu-servidor.database.windows.net` |
| `DB_PORT` | `1433` |
| `DB_NAME` | `Arkos` |
| `DB_USER` | tu usuario Azure (ej. `arkosadmin`) |
| `DB_PASSWORD` | tu contraseña Azure |
| `DB_ENCRYPT` | `true` |
| `DB_TRUST_CERT` | `false` |
| `DB_SKIP_CREATE` | `true` |

> `PORT` lo pone Render solo. No hace falta.

### 4. Despliega
1. Pulsa **Create Web Service**
2. Espera el build (instala dependencias, construye React, arranca Express)
3. Cuando diga **Live**, abre la URL tipo:  
   `https://arkos-xxxx.onrender.com`

### 5. Prueba la página
1. Abre la URL de Render
2. Debe verse el login de Arkos
3. Entra con:
   - Admin: `10000001` / `Admin123*`
   - Trabajador: `10000002` / `Obra123*`
4. Prueba también: `https://TU-URL.onrender.com/api/salud`  
   Debe responder: `{"ok":true,"app":"arkos"}`

---

## Parte C — Si algo falla

### Build falló
- Revisa que el repo tenga `package.json` con scripts `build` y `start`
- Build Command debe ser: `npm install && npm run build`

### La web abre pero dice error de base / login falla
- Revisa `DB_SERVER`, usuario y contraseña en Render
- En Azure: Networking → permitir **Azure services**
- En los logs de Render busca “No se pudo conectar con SQL Server”

### Plan Free se duerme
- En el plan gratuito Render apaga el servicio tras ~15 min sin uso
- La primera visita después puede tardar 30–60 segundos (normal)

### Actualizar la app
1. Sube cambios a `main` en GitHub
2. Render redespliega solo (Auto-Deploy)
3. O pulsa **Manual Deploy** → **Deploy latest commit**

---

## Resumen rápido

1. Crear Azure SQL Database `Arkos`  
2. En Render: New → Web Service → repo `Arkos_Proyecto`  
3. Build: `npm install && npm run build` · Start: `npm start`  
4. Pegar variables `JWT_SECRET` + `DB_*`  
5. Deploy → abrir la URL → entrar con las cuentas de prueba  

La misma base Azure se puede abrir en **SSMS 22** para la exposición.
