## Context

La tarjeta de login está en `client/src/pages/Login.jsx` y se ve con `.login form` en `client/src/styles.css`. Hoy el formulario no usa una cuadrícula con `gap`: cada etiqueta, título y botón hereda márgenes distintos (`h1` tiene 8px abajo, `.marca` no tiene margen, el botón no tiene margen arriba). Por eso el botón Entrar queda pegado a la contraseña y los bloques no se ven con el mismo aire.

## Goals / Non-Goals

**Goals:**

- Un solo ritmo vertical entre marca, título, empresa, documento, contraseña y botón.
- El botón Entrar un poco más abajo que el campo de contraseña.
- El cambio se limita a la tarjeta de login.

**Non-Goals:**

- No cambiar autenticación, API ni textos.
- No rediseñar colores, tipografía ni el encabezado oscuro.
- No tocar el resto de formularios del sistema.

## Decisions

1. **Cuadrícula con `gap` en `.login form`** — `display: grid` y un `gap` único (alrededor de 16px) para que todos los hijos tengan el mismo espacio. Se anulan márgenes extra de `h1`, `.marca` y `.ayuda` solo dentro de esa tarjeta para que el `gap` mande.
2. **Separación extra del botón** — `margin-top` pequeño (8–12px) en el botón Entrar de login, sin cambiar `.btn` global, para no mover botones de otras pantallas.
3. **El bloque `.demo` no cuenta en el ritmo** — si queda vacío (cuentas de prueba comentadas), no debe ocupar hueco visual.

## Risks / Trade-offs

- [Riesgo] Un `gap` global en labels vs. el `gap: 6px` interno de cada `label` (texto + input). → Mitigation: el `gap` de la tarjeta es entre bloques; el de `label` sigue siendo el espacio etiqueta–campo.
- [Riesgo] Cambiar `.btn` afecta otras páginas. → Mitigation: selector `.login form > .btn` o clase local.

## Migration Plan

Solo CSS (y clase si hace falta). Recargar el cliente. Rollback: quitar las reglas nuevas.

## Open Questions

Ninguna.
