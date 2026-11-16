## Why

En la tarjeta de inicio de sesión el botón Entrar queda pegado al campo de contraseña y los bloques (título, empresa, documento, contraseña y botón) no tienen el mismo espacio. Quien entra ve un formulario apretado y desigual.

## What Changes

- El botón Entrar baja un poco: queda un espacio claro entre la contraseña y el botón.
- Los elementos de la tarjeta (marca, título, texto de la empresa, documento, contraseña y botón) usan el mismo espacio vertical entre sí.
- No se cambia el texto, los campos ni el flujo de login.

## Capabilities

### New Capabilities

- `espaciado-tarjeta-login`: Espaciado uniforme de la tarjeta de inicio de sesión y separación extra del botón Entrar.

### Modified Capabilities

- Ninguna. `openspec/specs/` no tiene esta capacidad archivada.

## Impact

- Estilos de `.login form` en `client/src/styles.css`.
- Posible ajuste menor en `client/src/pages/Login.jsx` si hace falta una clase para el botón.
