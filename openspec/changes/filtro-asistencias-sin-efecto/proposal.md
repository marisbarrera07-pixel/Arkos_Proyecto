## Why

En la pantalla de asistencias, el botón Filtrar no cambia la tabla ni avisa si algo falló. Quien registra o consulta la asistencia no puede acotar las marcaciones por fecha, obra o trabajador, así que el historial no sirve para el seguimiento en obra.

## What Changes

- El botón Filtrar vuelve a consultar el reporte con los criterios elegidos: desde, hasta, obra y trabajador.
- La tabla muestra solo las marcaciones que cumplen esos criterios.
- Si no hay resultados, se muestra un mensaje claro en lugar de dejar la tabla igual.
- Si la consulta falla, se muestra el error. El botón indica que está filtrando mientras espera la respuesta.
- Exportar a Excel y PDF usa los mismos criterios que la tabla filtrada.

## Capabilities

### New Capabilities

- `filtro-reporte-asistencias`: Consulta del historial de asistencia acotada por fecha, obra y trabajador, con respuesta visible al usar Filtrar.

### Modified Capabilities

- Ninguna. Aún no hay especificaciones previas en `openspec/specs/`.

## Impact

- Pantalla de asistencias en `client/src/pages/Asistencias.jsx`.
- Endpoint existente `GET /api/asistencias/reporte` (parámetros `desde`, `hasta`, `obraId`, `trabajadorId`), sin cambio de contrato.
- Prueba del flujo de filtrado en `tests/flujo.mjs`.
