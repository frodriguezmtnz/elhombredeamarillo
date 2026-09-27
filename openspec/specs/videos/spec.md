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

### Requirement: Catálogo respaldado en Supabase
El sistema SHALL usar la tabla `videos` de Supabase como fuente de verdad del catálogo, con `src/data/videos.ts` como respaldo estático. El build (SEO, JSON-LD, vídeo destacado y portada) SHALL leer la tabla, y la página de vídeos SHALL refrescar el catálogo en runtime; ante error o proyecto pausado, SHALL servirse el respaldo estático sin romper el build ni la página.

#### Scenario: Build con Supabase disponible
- **WHEN** se compila el sitio con credenciales de Supabase válidas
- **THEN** el JSON-LD, el vídeo destacado y la portada se generan a partir de la tabla `videos`

#### Scenario: Supabase no disponible
- **WHEN** el build o la carga no pueden leer Supabase
- **THEN** el sitio usa `src/data/videos.ts` como respaldo y sigue funcionando

#### Scenario: Vídeo añadido sin redeploy
- **WHEN** se inserta un vídeo en la tabla `videos`
- **THEN** aparece en la página de vídeos al refrescar, sin necesidad de desplegar

### Requirement: Gestión del catálogo desde Supabase
El sistema SHALL permitir la gestión del catálogo con scripts locales: `pnpm video:add` inserta o actualiza un vídeo a partir de su ID de YouTube y `pnpm video:sync` siembra la tabla desde el respaldo estático. La lectura de `videos` SHALL ser pública (RLS) y la escritura SHALL requerir la service role key, nunca expuesta al cliente.

#### Scenario: Alta de un vídeo
- **WHEN** se ejecuta `pnpm video:add <videoId>` con los campos editoriales
- **THEN** el vídeo se inserta en la tabla `videos` y pasa a mostrarse en el catálogo

### Requirement: Miniaturas auto-hospedadas con respaldo
El sistema SHALL servir las miniaturas desde `/assets/thumbs/` (generadas con `pnpm thumbs`, que detecta IDs tanto en `src/` como en la tabla `videos`) y SHALL usar la miniatura remota de YouTube como respaldo si la local no está disponible.

#### Scenario: Miniatura local no disponible
- **WHEN** la miniatura auto-hospedada no carga
- **THEN** se intenta la miniatura remota de YouTube y, si también falla, la imagen se oculta sobre un fondo neutro

### Requirement: Portada con últimas publicaciones
La portada SHALL mostrar las últimas seis publicaciones en un carrusel en bucle infinito que avanza una posición cada cinco segundos, con navegación por puntos y flechas (desde tablet). La tarjeta siguiente SHALL quedar parcialmente visible para indicar que hay más contenido. Los puntos SHALL rellenarse durante el intervalo de cinco segundos, marcando los ya vistos. El avance SHALL pausarse al pasar el ratón o con la pestaña oculta, y SHALL desactivarse si el usuario prefiere movimiento reducido.

#### Scenario: Avance automático
- **WHEN** la portada permanece visible y sin interacción
- **THEN** el carrusel avanza una posición cada cinco segundos, rellenando el punto activo, y hace bucle

#### Scenario: Bucle infinito
- **WHEN** el carrusel supera la última publicación (o retrocede desde la primera)
- **THEN** la primera (o la última) vuelve a entrar sin salto visible, de forma continua

#### Scenario: Navegación manual
- **WHEN** el usuario pulsa una flecha, un punto o desplaza el carrusel
- **THEN** el carrusel se mueve a la posición elegida y reinicia el ciclo de cinco segundos

#### Scenario: Contenido adicional visible
- **WHEN** el carrusel se muestra en pantallas con varias tarjetas por vista
- **THEN** la siguiente tarjeta aparece parcialmente cortada

#### Scenario: Pausa e interacción
- **WHEN** el usuario pasa el ratón por el carrusel o la pestaña queda oculta
- **THEN** el avance automático y el relleno del punto se detienen, y al reanudar continúan donde iban

#### Scenario: Movimiento reducido
- **WHEN** el usuario tiene activado `prefers-reduced-motion`
- **THEN** el carrusel no avanza solo, aunque los puntos y las flechas permiten navegar

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
