## Context

La pantalla de asistencias del administrador (`client/src/pages/Asistencias.jsx`) tiene un formulario con fecha desde, fecha hasta, obra, trabajador y el botón Filtrar. Al enviarlo llama a `cargar()`, que pide `GET /api/asistencias/reporte` con esos parámetros. El backend ya filtra en `reporte` por `desde`, `hasta`, `obraId` y `trabajadorId`.

Hoy el clic no se siente: la llamada no muestra carga ni error, y si el resultado queda vacío la tabla solo conserva el encabezado. Quien acaba de registrar o revisar una asistencia cree que Filtrar no hace nada. La pantalla del trabajador para marcar entrada o salida no tiene este botón; el arreglo es de la consulta, no de la marcación de un toque.

## Goals / Non-Goals

**Goals:**

- Que Filtrar vuelva a pedir el reporte con los criterios visibles en el formulario.
- Que la tabla, el Excel y el PDF usen exactamente esos criterios.
- Que un resultado vacío o un fallo se vean en pantalla.

**Non-Goals:**

- No cambiar el contrato del endpoint ni agregar filtros nuevos (tipo de marcación, puntualidad).
- No poner un filtro en la pantalla de marcación del trabajador.
- No modificar corrección, anulación ni solicitudes.

## Decisions

1. **Reutilizar `GET /api/asistencias/reporte`.** El filtro ya está en el servidor. La falla visible está en la pantalla: el envío no informa el resultado. Alternativa descartada: un endpoint nuevo, porque duplicaría la misma consulta.

2. **Pasar los criterios en el momento del clic.** `cargar` recibirá el objeto de filtros del formulario, no una lectura implícita que pueda quedar desfasada respecto a lo que el usuario acaba de elegir. La cadena de consulta seguirá siendo `desde`, `hasta`, `obraId` y `trabajadorId`, omitiendo los vacíos.

3. **Estado de la consulta en la misma pantalla.** Mientras la petición sigue, el botón muestra "Filtrando..." y queda deshabilitado. Si la lista llega vacía, un texto dice que no hay marcaciones con esos criterios. Si `api` rechaza, el mensaje de error existente muestra la causa.

4. **Excel y PDF leen los mismos criterios.** `descargarCsv` e `imprimir` usan el último filtro aplicado, para no exportar el listado completo cuando la tabla está acotada.

## Risks / Trade-offs

- [El usuario espera filtrar en la pantalla de marcación del trabajador] → Esta propuesta no agrega ese control. La marcación sigue siendo un toque de Entrada o Salida. Si hacía falta ahí, se abre otro cambio.
- [Un rango de fechas invertido (hasta anterior a desde) devuelve cero filas] → Se muestra el mensaje de lista vacía. No se bloquea el formulario en esta corrección.
- [La prueba automática no abre el navegador] → Se cubre el filtro en `tests/flujo.mjs` contra el reporte. La pantalla se revisa al aplicar el cambio.

## Migration Plan

No hay datos que migrar. El arreglo es de interfaz y de la prueba. Si el comportamiento no convence, se revierte `Asistencias.jsx` y el caso nuevo del test; el endpoint queda igual.

## Open Questions

Ninguna. El alcance es el botón Filtrar de la pantalla de asistencias del administrador.
