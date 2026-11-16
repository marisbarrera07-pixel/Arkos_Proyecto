## ADDED Requirements

### Requirement: Botón para registrar la jornada
La pantalla de asistencias del administrador MUST mostrar un botón "Registrar asistencia" que abre el formulario de la jornada.

#### Scenario: Abrir el registro
- **WHEN** el administrador pulsa "Registrar asistencia"
- **THEN** aparece el formulario con la fecha en una columna y, en la otra, la hora de ingreso y la hora de salida

### Requirement: Guardar fecha, ingreso y salida
El sistema MUST guardar una jornada con la persona, la obra, la fecha y la hora de ingreso. La hora de salida MUST ser opcional. Si se indica, MUST ser posterior a la hora de ingreso.

#### Scenario: Jornada con ingreso y salida
- **WHEN** el administrador elige persona y obra, escribe la fecha, la hora de ingreso y la hora de salida, y confirma
- **THEN** la jornada queda guardada con ambas horas

#### Scenario: Jornada solo con ingreso
- **WHEN** el administrador confirma la fecha y la hora de ingreso sin hora de salida
- **THEN** la jornada queda guardada solo con el ingreso

#### Scenario: Salida anterior al ingreso
- **WHEN** la hora de salida es anterior o igual a la hora de ingreso
- **THEN** el sistema no guarda la jornada y explica que la salida debe ser después del ingreso

### Requirement: Historial de la jornada
El sistema MUST listar debajo del registro una fila por persona, obra y fecha, con la fecha de ingreso, la hora de ingreso, el cargo, la obra, si el ingreso fue puntual y el estado.

#### Scenario: Cargo de la persona
- **WHEN** el historial muestra una jornada
- **THEN** la columna de cargo muestra el cargo registrado de esa persona, como trabajador, encargado o CIS

#### Scenario: Persona que sigue en la obra
- **WHEN** la jornada tiene hora de ingreso y no tiene hora de salida
- **THEN** el estado de esa fila es Activo

#### Scenario: Persona que ya salió
- **WHEN** la jornada tiene hora de ingreso y hora de salida
- **THEN** el estado de esa fila es Ya salió

#### Scenario: Ingreso puntual
- **WHEN** la hora de ingreso cae dentro del horario vigente de la obra y en un día laboral
- **THEN** el historial marca la jornada como puntual

#### Scenario: Ingreso fuera de horario
- **WHEN** la hora de ingreso queda fuera del horario vigente de la obra
- **THEN** el historial marca la jornada como fuera de horario
