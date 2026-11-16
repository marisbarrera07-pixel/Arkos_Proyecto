## ADDED Requirements

### Requirement: Filtrar el historial de asistencia
El sistema MUST actualizar el listado de asistencias cuando el administrador envía el formulario Filtrar, usando solo los criterios que haya elegido: fecha desde, fecha hasta, obra y trabajador.

#### Scenario: Filtrar por obra y trabajador
- **WHEN** el administrador elige una obra y un trabajador y pulsa Filtrar
- **THEN** la tabla muestra únicamente las marcaciones de ese trabajador en esa obra

#### Scenario: Filtrar por rango de fechas
- **WHEN** el administrador indica fecha desde y fecha hasta y pulsa Filtrar
- **THEN** la tabla muestra únicamente las marcaciones cuya fecha está dentro de ese rango, incluidos los extremos

#### Scenario: Dejar un criterio vacío
- **WHEN** el administrador deja obra o trabajador sin elegir y pulsa Filtrar
- **THEN** ese criterio no restringe el listado

### Requirement: Avisar el resultado del filtro
El sistema MUST indicar que está consultando y MUST mostrar un mensaje cuando no hay marcaciones o cuando la consulta falla.

#### Scenario: Consulta en curso
- **WHEN** el administrador pulsa Filtrar y la respuesta aún no llega
- **THEN** el botón queda deshabilitado e indica que está filtrando

#### Scenario: Sin resultados
- **WHEN** el filtro no encuentra marcaciones
- **THEN** la tabla no muestra filas anteriores y aparece un mensaje de que no hay marcaciones con esos criterios

#### Scenario: Error de consulta
- **WHEN** la petición del reporte falla
- **THEN** se muestra el mensaje de error y el botón Filtrar vuelve a poder usarse

### Requirement: Exportar con el mismo filtro
El sistema MUST exportar a Excel y a PDF las mismas marcaciones que muestra la tabla filtrada.

#### Scenario: Exportar después de filtrar
- **WHEN** el administrador filtró el listado y luego elige Exportar Excel o Exportar PDF
- **THEN** el archivo contiene solo las marcaciones que cumplen el filtro activo
