# expedientes Specification

## Purpose
Define el archivo editorial de teorías de FROM: fichas/dossiers con tesis, evidencias y dudas, filtros por categoría y estado, conexiones entre casos, línea temporal y enlaces a fuentes.

## Requirements

### Requirement: Catálogo de expedientes
El sistema SHALL renderizar los dossiers y las fuentes desde contenido estático editorial, sin depender de servicios externos en tiempo de ejecución.

#### Scenario: Carga del archivo
- **WHEN** el usuario abre la página de expedientes
- **THEN** se muestran las fichas disponibles con su número, categoría y estado

### Requirement: Filtrado y vista
El sistema SHALL permitir filtrar los dossiers por categoría y/o estado y alternar entre vista de tablero y vista de línea temporal.

#### Scenario: Filtrar por categoría
- **WHEN** el usuario selecciona una categoría
- **THEN** solo se muestran los dossiers de esa categoría

#### Scenario: Cambiar a línea temporal
- **WHEN** el usuario cambia de vista
- **THEN** los dossiers se ordenan y presentan cronológicamente

### Requirement: Detalle del expediente
Al abrir un dossier, el sistema SHALL mostrar tesis, evidencias, dudas, etiquetas, conexiones con otros dossiers y enlaces a las fuentes que lo respaldan.

#### Scenario: Abrir un caso
- **WHEN** el usuario pulsa una ficha
- **THEN** se abre el detalle con tesis, evidencias, dudas y fuentes

#### Scenario: Navegar por conexiones
- **WHEN** el usuario pulsa un dossier relacionado dentro del detalle
- **THEN** se abre el dossier conectado

### Requirement: Enlace a fuente original
El sistema SHALL permitir abrir la fuente (vídeo o publicación) de cada evidencia en una pestaña nueva.

#### Scenario: Ver fuente
- **WHEN** el usuario pulsa una fuente de un dossier
- **THEN** se abre el contenido original en una pestaña nueva
