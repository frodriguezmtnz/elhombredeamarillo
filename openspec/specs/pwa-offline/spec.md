# pwa-offline Specification

## Purpose
Define el comportamiento instalable y offline de la web: manifest de aplicación, service worker registrado y estrategias de caché resilientes ante fallos de red.

## Requirements

### Requirement: Aplicación instalable
El sistema SHALL exponer un manifest web con nombre, iconos, color de tema e idioma para permitir la instalación como aplicación.

#### Scenario: Manifest disponible
- **WHEN** un navegador compatible solicita el manifest
- **THEN** recibe nombre, iconos 192/512 (incluido maskable), `start_url`, `display` standalone y `lang` es

### Requirement: Service worker con estrategias de caché
El service worker SHALL aplicar red-primero a HTML, JS y CSS, y stale-while-revalidate al resto de assets del mismo origen. Los assets estáticos SHALL cachearse bajo una versión de caché concreta y las versiones antiguas SHALL eliminarse al activarse.

#### Scenario: Documento con red disponible
- **WHEN** se solicita un documento HTML con red disponible
- **THEN** se sirve la versión de red y se actualiza la caché

#### Scenario: Asset con red disponible
- **WHEN** se solicita una imagen o asset estático
- **THEN** se sirve la copia en caché si existe y se revalida en segundo plano

### Requirement: Resiliencia ante fallo de red
El service worker SHALL no dejar promesas rechazadas: ante un fallo de red SHALL devolver la copia en caché si existe o una respuesta de error controlada.

#### Scenario: Sin caché y sin red
- **WHEN** falla la petición de un asset que no está en caché
- **THEN** el service worker responde con un error controlado y no lanza una excepción no capturada

#### Scenario: Recursos de otro origen
- **WHEN** la petición es de un origen distinto
- **THEN** el service worker la deja pasar y tampoco propaga un rechazo sin manejar
