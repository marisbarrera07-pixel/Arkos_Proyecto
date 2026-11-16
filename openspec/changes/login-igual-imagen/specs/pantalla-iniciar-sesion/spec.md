## ADDED Requirements

### Requirement: Pantalla partida de inicio de sesión
La pantalla de inicio de sesión SHALL mostrar dos zonas en escritorio: a la izquierda la marca Arkos sobre fondo oscuro con franjas amarillas y negras, y a la derecha el formulario de acceso.

#### Scenario: Vista de escritorio
- **WHEN** una persona abre `/login` en un ancho de escritorio
- **THEN** SHALL verse el panel izquierdo con ARKOS, el título «Asistencia de trabajadores en obra» y «ACM Diseño y Construcciones SAS»
- **AND** SHALL verse a la derecha una tarjeta con el formulario de inicio de sesión

#### Scenario: Vista estrecha
- **WHEN** una persona abre `/login` en un ancho menor a 800px
- **THEN** el formulario SHALL permanecer visible y usable
- **AND** la marca SHALL no tapar los campos

### Requirement: Formulario Iniciar sesión
El formulario SHALL incluir el título «Iniciar sesión», el texto «Ingresa con tu documento y tu contraseña.», el campo Documento, el campo Contraseña, el botón Entrar a todo el ancho de la tarjeta y el aviso de contraseña olvidada.

#### Scenario: Campos y textos de la tarjeta
- **WHEN** una persona ve el formulario
- **THEN** el campo Documento SHALL tener el placeholder «Número de documento»
- **AND** debajo SHALL aparecer la pista «Solo números, sin puntos ni espacios.»
- **AND** el botón Entrar SHALL ocupar el ancho de la tarjeta
- **AND** debajo del botón SHALL aparecer «¿Olvidaste tu contraseña? Pide a un administrador que la restablezca.»

### Requirement: Mostrar u ocultar contraseña
El campo Contraseña SHALL incluir un control «Mostrar» que revela o oculta el texto sin enviar el formulario.

#### Scenario: Alternar visibilidad
- **WHEN** una persona pulsa «Mostrar»
- **THEN** la contraseña SHALL verse en texto claro y el control SHALL pasar a «Ocultar»
- **WHEN** pulsa «Ocultar»
- **THEN** la contraseña SHALL volver a ocultarse

### Requirement: Login sin cambio de flujo
El envío del formulario SHALL seguir autenticando con documento y contraseña y redirigiendo según el rol.

#### Scenario: Entrar con credenciales válidas
- **WHEN** una persona escribe documento y contraseña correctos y pulsa Entrar
- **THEN** el sistema SHALL iniciar sesión y redirigir al administrador a asistencias o al trabajador a marcar
