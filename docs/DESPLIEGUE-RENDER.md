# Desplegar Sistema Arkos en Render (100% gratis)

Solo necesitas **un Web Service** en Render.  
No uses Azure ni otra base externa: la app usa **SQLite** y, si el servicio se reinicia o se duerme, vuelve a empezar con las cuentas de prueba.

---

## Paso a paso

### 1. Entra a Render
1. Abre [https://dashboard.render.com](https://dashboard.render.com)
2. Inicia sesión con **GitHub**
3. Autoriza el repo `marisbarrera07-pixel/Arkos_Proyecto` si te lo pide

### 2. Crea el Web Service
1. Pulsa **New +** → **Web Service**
2. Elige el repositorio **Arkos_Proyecto**
3. Configura:

| Campo | Valor |
|--------|--------|
| **Name** | `arkos` |
| **Region** | Oregon (o la que quieras) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance type** | **Free** |

### 3. Variables de entorno
En **Environment** agrega solo estas:

| Key | Value |
|-----|--------|
| `NODE_VERSION` | `22` |
| `DB_CLIENT` | `sqlite` |
| `DB_PATH` | `:memory:` |
| `JWT_SECRET` | una frase larga secreta (o usa “Generate”) |

No hace falta `DB_SERVER`, `DB_USER` ni `DB_PASSWORD`.

### 4. Despliega
1. Pulsa **Create Web Service**
2. Espera a que el build termine y diga **Live**
3. Abre la URL, por ejemplo: `https://arkos-xxxx.onrender.com`

### 5. Prueba
- Login admin: documento `10000001` / contraseña `Admin123*`
- Login trabajador: `10000002` / `Obra123*`
- Salud: `https://TU-URL.onrender.com/api/salud` → `{"ok":true,"app":"arkos"}`

---

## Qué debes saber del plan Free

- Tras ~15 minutos sin visitas, Render **apaga** el servicio.
- La primera visita después puede tardar 30–60 segundos.
- Al reiniciar, la base SQLite en memoria **empieza de cero** (cuentas de prueba otra vez). Eso es normal y está bien para demo/aula.

---

## Actualizar la app

1. Sube cambios a la rama `main` en GitHub  
2. Render redespliega solo  
3. O **Manual Deploy** → **Deploy latest commit**

---

## Opción Blueprint

Si prefieres: **New +** → **Blueprint** → selecciona el repo (usa el archivo `render.yaml` ya incluido).
