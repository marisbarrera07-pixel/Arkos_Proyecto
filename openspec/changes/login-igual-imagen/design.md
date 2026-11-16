## Context

Hoy `/login` es una sola columna: tarjeta crema centrada, marca ARKOS dentro del formulario y botón Entrar pequeño. El diseño de referencia es una pantalla partida (marca a la izquierda, formulario a la derecha) con franjas amarillas y negras de obra. El login por documento y contraseña contra `POST /api/auth/login` se mantiene.

## Goals / Non-Goals

**Goals:**

- Replicar la disposición y los textos de la imagen en escritorio.
- Añadir placeholder, pista numérica, mostrar/ocultar contraseña, botón Entrar a todo el ancho y el aviso de contraseña olvidada.
- En pantallas estrechas apilar el contenido para que el formulario siga usable.

**Non-Goals:**

- No cambiar autenticación, JWT ni redirección por rol.
- No implementar restablecimiento de contraseña (el texto es solo informativo).
- No rediseñar Layout ni el resto de páginas.

## Decisions

1. **Dos columnas en `.login`** — `display: grid` 1fr / 1fr. Panel izquierdo oscuro (`#1c1914`) con franjas diagonales amarillo/negro arriba y abajo (el mismo patrón que `.barra`). Panel derecho color `--papel` con la tarjeta centrada. Alternativa descartada: seguir con una sola tarjeta, porque no coincide con la imagen.

2. **Marca fuera del formulario** — ARKOS, el título de asistencia y ACM van en el panel izquierdo (texto blanco; ACM en `--amarillo`). El formulario a la derecha empieza por **Iniciar sesión**.

3. **Controles del formulario** — Documento con `placeholder="Número de documento"`, `inputMode="numeric"` y texto de ayuda. Contraseña en un contenedor con botón **Mostrar** / **Ocultar** que cambia `type` entre `password` y `text`. Entrar: `width: 100%`, píldora amarilla. Debajo, el aviso de olvidar contraseña como párrafo, no como enlace de flujo.

4. **Estilos acotados a `.login`** — Las reglas nuevas (botón ancho, campos, franjas) viven bajo `.login` para no cambiar botones de otras pantallas.

5. **Móvil** — Por debajo de ~800px una sola columna: panel de marca compacto arriba y formulario debajo.

## Risks / Trade-offs

- [El botón **Mostrar** queda fuera de alcance al teclado] → Mitigation: es un `button type="button"` con etiqueta clara.
- [Un estilo global de `.btn` deja el Entrar pequeño] → Mitigation: `.login form .btn` a ancho completo.
- [El texto de olvido se interpreta como enlace roto] → Mitigation: no es un `<a>`; es texto de ayuda.

## Migration Plan

Cambiar `Login.jsx` y CSS de `.login`. Recargar el cliente. Rollback: volver a la tarjeta centrada anterior.

## Open Questions

Ninguna. El restablecimiento de contraseña queda fuera a propósito.
