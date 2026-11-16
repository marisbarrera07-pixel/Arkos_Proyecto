## 1. Alta de la jornada

- [x] 1.1 Crear `POST /api/asistencias/jornada` para administrador, con persona, obra, fecha, hora de ingreso y hora de salida opcional
- [x] 1.2 Rechazar la salida si no es posterior al ingreso, si la persona no está asignada a la obra o si ese día ya tiene entrada
- [x] 1.3 Guardar la entrada y, si viene salida, la salida en la misma transacción, y clasificar la puntualidad del ingreso con `validarHorario`

## 2. Historial agrupado

- [x] 2.1 Crear `GET /api/asistencias/jornadas` que una la entrada y la salida no anuladas de la misma persona, obra y fecha
- [x] 2.2 Incluir fecha de ingreso, hora de ingreso, hora de salida, cargo (o el rol si el cargo está vacío), obra, puntualidad y estado Activo o Ya salió

## 3. Pantalla de asistencias

- [x] 3.1 Agregar el botón "Registrar asistencia" que abre el formulario en dos columnas: fecha, y hora de ingreso con hora de salida
- [x] 3.2 Pedir persona y obra encima de esas columnas y mostrar el error si el alta falla
- [x] 3.3 Listar debajo el historial con fecha, hora de ingreso, cargo, obra, puntualidad y estado

## 4. Prueba

- [x] 4.1 Cubrir en `tests/flujo.mjs` una jornada con salida (Ya salió), una solo con ingreso (Activo) y una salida que no es posterior al ingreso
- [x] 4.2 Ejecutar `npm test` y confirmar que el flujo sigue pasando
