## 1. Consulta al pulsar Filtrar

- [x] 1.1 Hacer que `cargar` en `client/src/pages/Asistencias.jsx` reciba los filtros del formulario y arme la consulta con `desde`, `hasta`, `obraId` y `trabajadorId`, omitiendo los vacíos
- [x] 1.2 Deshabilitar el botón Filtrar y cambiar su texto a "Filtrando..." mientras la petición sigue
- [x] 1.3 Mostrar el error de `api` si el reporte falla y volver a habilitar el botón

## 2. Resultado visible

- [x] 2.1 Reemplazar las filas de la tabla con la respuesta filtrada, sin dejar marcaciones del listado anterior
- [x] 2.2 Mostrar un mensaje cuando la respuesta no trae marcaciones
- [x] 2.3 Hacer que Exportar Excel y Exportar PDF usen el mismo filtro que la tabla

## 3. Prueba

- [x] 3.1 Agregar en `tests/flujo.mjs` un caso que consulte `GET /api/asistencias/reporte` por obra y por rango de fechas y compruebe que excluye las marcaciones que no cumplen
- [x] 3.2 Ejecutar `npm test` y confirmar que el flujo sigue pasando
