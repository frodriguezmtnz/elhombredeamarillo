# Spec Delta

## Purpose

Define el catálogo de vídeos del canal El Hombre de Amarillo y el directorio de creadores invitados, con sus referencias y enlaces a YouTube.

## ADDED Requirements

### Requirement: Catálogo de vídeos
El sistema SHALL listar los vídeos del canal con título, categoría, miniatura y fecha, permitiendo destacar un vídeo principal y filtrar por categoría.

#### Scenario: Carga del catálogo
- **WHEN** el usuario abre la página de vídeos
- **THEN** se muestran los vídeos ordenados con su miniatura y metadatos

#### Scenario: Vídeo destacado
- **WHEN** el usuario abre la página de vídeos
- **THEN** el vídeo más reciente o destacado se presenta en un bloque principal

### Requirement: Miniatura con respaldo
El sistema SHALL obtener las miniaturas de YouTube y SHALL usar una imagen de respaldo si la principal no está disponible.

#### Scenario: Miniatura no disponible
- **WHEN** la miniatura en alta calidad no carga
- **THEN** se usa la imagen de calidad inferior o el respaldo local

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
