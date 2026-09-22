# Spec Delta

## Purpose

Define el tablero comunitario de misterios de FROM: catálogo de misterios, hipótesis votables, propuestas de la comunidad y modo de emisión en directo.

## ADDED Requirements

### Requirement: Catálogo de misterios
El sistema SHALL cargar los misterios y sus hipótesis desde Supabase, mostrando metadatos (código, título, categoría, contexto, menciones y número de hipótesis). Si la carga falla, SHALL mostrar un estado de error legible.

#### Scenario: Carga correcta
- **WHEN** la página de comunidad carga y Supabase responde
- **THEN** se listan los misterios ordenados y se habilitan los filtros

#### Scenario: Error de carga
- **WHEN** Supabase devuelve un error
- **THEN** se muestra un mensaje de error en lugar de una lista vacía silenciosa

### Requirement: Voto de hipótesis
El sistema SHALL permitir votar y retirar el voto de una hipótesis solo con sesión iniciada. La actualización SHALL ser optimista y SHALL revertirse si la escritura falla. Sin sesión, el voto SHALL mostrarse bloqueado con una indicación.

#### Scenario: Usuario sin sesión
- **WHEN** el usuario no ha iniciado sesión
- **THEN** el botón de voto aparece bloqueado con una pista para iniciar sesión

#### Scenario: Error al votar
- **WHEN** la inserción o borrado del voto falla
- **THEN** el contador y el estado vuelven a su valor anterior

### Requirement: Propuesta de hipótesis
El sistema SHALL permitir proponer una hipótesis con título y descripción, solo con sesión iniciada. El título SHALL tener entre 15 y 100 caracteres y la descripción SHALL ser no vacía con un máximo de 255 caracteres. La autoría SHALL tomarse de la cuenta.

#### Scenario: Envío válido
- **WHEN** el usuario autenticado envía título y descripción válidos
- **THEN** la hipótesis se registra y la vista se refresca

#### Scenario: Formulario incompleto
- **WHEN** el título no alcanza el mínimo o la descripción está vacía o excede el máximo
- **THEN** el botón de envío permanece deshabilitado

### Requirement: Filtro de mis votos y modo stream
El sistema SHALL permitir filtrar las hipótesis por los votos del usuario y SHALL ofrecer un modo de emisión que muestre el tablero en formato presentación.

#### Scenario: Activar mis votos
- **WHEN** el usuario con sesión activa el filtro «mis votos»
- **THEN** solo se resaltan o listan las hipótesis votadas por él

#### Scenario: Abrir modo stream
- **WHEN** el usuario abre el modo stream
- **THEN** el tablero se muestra en formato de presentación y puede cerrarse
