## Why

La pantalla de inicio de sesión actual es una tarjeta centrada sobre un fondo sencillo. El diseño de referencia es una pantalla partida: marca Arkos a la izquierda y el formulario a la derecha, con franjas de obra, botón ancho y ayudas al usuario.

## What Changes

- La pantalla `/login` pasa a dos columnas: panel oscuro de marca a la izquierda y formulario a la derecha, como en la imagen.
- El formulario muestra el título **Iniciar sesión**, el texto de ayuda, Documento con placeholder y pista numérica, Contraseña con botón **Mostrar**, **Entrar** a todo el ancho y el aviso de contraseña olvidada.
- El flujo de autenticación (API, JWT, redirección por rol) no cambia.
- El texto de contraseña olvidada es informativo: no hay restablecimiento automático.

## Capabilities

### New Capabilities

- `pantalla-iniciar-sesion`: Disposición, textos y controles de la pantalla de inicio de sesión según el diseño de referencia.

### Modified Capabilities

- Ninguna. `openspec/specs/` no tiene esta capacidad archivada.

## Impact

- `client/src/pages/Login.jsx` y estilos de `.login` en `client/src/styles.css`.
- No hay cambios de API, base de datos ni de otras pantallas, salvo que algún estilo global de login se acote para no afectar tarjetas o botones del resto de la app.
