## ADDED Requirements

### Requirement: Espacio uniforme en la tarjeta de login
La tarjeta de inicio de sesión SHALL mostrar el mismo espacio vertical entre marca ARKOS, título, texto de la empresa, campo Documento, campo Contraseña y botón Entrar.

#### Scenario: Bloques alineados con el mismo aire
- **WHEN** una persona abre la pantalla de inicio de sesión
- **THEN** el espacio entre cada bloque de la tarjeta (marca, título, empresa, documento, contraseña) SHALL ser el mismo

### Requirement: Botón Entrar más separado de la contraseña
El botón Entrar SHALL quedar un poco más abajo que el campo Contraseña, con un espacio extra respecto al ritmo uniforme de los campos.

#### Scenario: Botón no pegado a la contraseña
- **WHEN** una persona ve el formulario de login
- **THEN** el botón Entrar SHALL tener más espacio encima que el que hay entre Documento y Contraseña
- **AND** el botón SHALL seguir siendo el control que envía el formulario
