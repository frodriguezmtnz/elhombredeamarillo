# videos Specification

## Purpose
Define el catálogo de vídeos del canal El Hombre de Amarillo y el directorio de creadores invitados, con sus referencias y enlaces a YouTube.

## Requirements

### Requirement: Catálogo de vídeos
El sistema SHALL listar los vídeos del canal con título, categoría, miniatura y fecha, permitiendo destacar un vídeo principal y filtrar por categoría.

#### Scenario: Carga del catálogo
- **WHEN** el usuario abre la página de vídeos
- **THEN** se muestran los vídeos ordenados con su miniatura y metadatos

#### Scenario: Vídeo destacado
- **WHEN** el usuario abre la página de vídeos
- **THEN** el vídeo más reciente o destacado se presenta en un bloque principal

### Requirement: Miniaturas auto-hospedadas con respaldo
El sistema SHALL servir las miniaturas desde `/assets/thumbs/` (generadas con `pnpm thumbs`) y SHALL usar la miniatura remota de YouTube como respaldo si la local no está disponible.

#### Scenario: Miniatura local no disponible
- **WHEN** la miniatura auto-hospedada no carga
- **THEN** se intenta la miniatura remota de YouTube y, si también falla, la imagen se oculta sobre un fondo neutro

### Requirement: Directorio de creadores
El sistema SHALL mostrar un directorio de creadores invitados con su nombre, handle e imagen, enlazando a su perfil externo.

#### Scenario: Visitar creador
- **WHEN** el usuario pulsa un creador
- **THEN** se abre su perfil en una pestaña nueva

### Requirement: Referencias del vídeo
El sistema SHALL mostrar las referencias asociadas a cada vídeo (fanart, entrevistas u otras) con su crédito y enlace original.

#### Scenario: Ver referencia
- **WHEN** el usuario abre las referencias de un vídeo
- **THEN** se listan con su autoría, descripción y enlace a la publicación original
