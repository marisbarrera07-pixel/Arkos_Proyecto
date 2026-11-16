## Context

La pantalla de asistencias del administrador lista marcaciones sueltas de entrada o salida. No hay un botón para dejar la jornada del día, y el historial no muestra el cargo ni si la persona sigue en la obra. El modelo ya guarda `ENTRADA` y `SALIDA` por persona, obra y fecha, y `validarHorario` dice si la hora cae dentro de la jornada de la obra. El cargo vive en `usuario.cargo` (por ejemplo trabajador, encargado o CIS).

## Goals / Non-Goals

**Goals:**

- Abrir desde Asistencias un registro con fecha, hora de ingreso y hora de salida.
- Guardar esa jornada y listarla abajo en una fila por persona, obra y fecha.
- Mostrar cargo, obra, puntualidad del ingreso y estado Activo o Ya salió.

**Non-Goals:**

- No quitar el botón de un toque del trabajador ni el filtro ya existente.
- No crear un catálogo cerrado de cargos. Se muestra el cargo que ya tiene la persona.
- No cambiar corrección, anulación ni exportación.

## Decisions

1. **Un endpoint de jornada, no dos clics.** `POST /api/asistencias/jornada` recibe persona, obra, fecha, hora de ingreso y hora de salida opcional. Crea la entrada y, si viene salida, la salida, en la misma transacción. Alternativa descartada: que la pantalla llame dos veces a `/registrar`, porque un fallo a medias dejaría la entrada sin la salida.

2. **La salida vacía significa Activo.** Si no hay hora de salida, solo se guarda la entrada y el historial dice Activo. Si hay salida, el estado es Ya salió. La salida debe ser posterior al ingreso.

3. **La puntualidad sale del ingreso.** Se reutiliza `validarHorario` con la hora de ingreso. La salida no cambia esa clasificación.

4. **El historial agrupa lo que ya existe.** `GET /api/asistencias/jornadas` junta la entrada y la salida no anuladas de la misma persona, obra y fecha. Así también aparecen las marcaciones hechas con el botón del trabajador. El cargo es `usuario.cargo`; si está vacío, se muestra el rol en español.

5. **Persona y obra se eligen, pero no son columnas de hora.** Sin ellas no se sabe de quién es la jornada. El formulario visual queda en dos columnas: fecha a la izquierda; hora de ingreso y hora de salida a la derecha. Persona y obra van encima, en la misma ficha.

## Risks / Trade-offs

- [Ya existe una entrada ese día] → El alta responde que esa jornada ya fue registrada y no duplica la fila.
- [La persona no está asignada a la obra] → Se rechaza el registro con un mensaje claro.
- [Una marcación anulada no debe verse como jornada activa] → El agrupado ignora registros anulados.

## Migration Plan

No hay migración de tablas. Las jornadas nuevas usan las marcaciones actuales. Si se revierte, se quitan el botón, el endpoint y la vista agrupada; las filas de entrada y salida siguen en la base.

## Open Questions

Ninguna.
