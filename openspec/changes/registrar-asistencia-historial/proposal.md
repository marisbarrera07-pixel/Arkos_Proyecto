## Why

En Asistencias no se puede dejar una jornada completa desde el panel: falta un registro con fecha, hora de ingreso y hora de salida, y el listado no dice el cargo ni si la persona sigue en la obra o ya salió.

## What Changes

- Un botón "Registrar asistencia" abre el formulario de la jornada.
- El formulario tiene dos columnas: la fecha, y en la otra la hora de ingreso junto con la hora de salida.
- Para saber de quién es la jornada, se elige la persona y la obra. Esos datos no son columnas extra del formulario de horas.
- Debajo queda el historial de una fila por jornada: fecha de ingreso, hora de ingreso, cargo (trabajador, encargado, CIS o el cargo que tenga), obra, si estuvo puntual y el estado (activo o ya salió).
- La hora de salida puede quedar vacía. En ese caso la persona sigue activa en la obra.

## Capabilities

### New Capabilities

- `registro-jornada-asistencia`: Registro manual de una jornada y su historial con cargo, obra, puntualidad y si la persona sigue en obra o ya salió.

### Modified Capabilities

- Ninguna. `openspec/specs/` no tiene especificaciones previas.

## Impact

- Pantalla de asistencias en `client/src/pages/Asistencias.jsx`.
- API de asistencias: alta de ingreso y salida en la misma jornada, y consulta del historial agrupado.
- El horario de la obra sigue clasificando si el ingreso fue puntual.
