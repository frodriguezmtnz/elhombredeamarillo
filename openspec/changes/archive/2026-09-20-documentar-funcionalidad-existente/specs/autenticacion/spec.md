# Spec Delta

## Purpose

Define la autenticación con Supabase: sesión persistente, formulario modal de acceso/registro y degradación elegante cuando no hay credenciales configuradas.

## ADDED Requirements

### Requirement: Sesión de usuario
El sistema SHALL restaurar la sesión existente al cargar, SHALL mantenerse a la escucha de cambios de sesión y SHALL exponer el usuario actual al resto de la interfaz.

#### Scenario: Sesión previa
- **WHEN** un usuario con sesión guardada carga la página
- **THEN** la interfaz lo reconoce como usuario autenticado

#### Scenario: Cambio de estado
- **WHEN** el usuario inicia o cierra sesión
- **THEN** la interfaz refleja el nuevo estado sin recargar la página

### Requirement: Acceso y registro modal
El sistema SHALL ofrecer un diálogo modal para iniciar sesión o crear cuenta con email y contraseña, con una longitud mínima de contraseña y mensajes de error visibles.

#### Scenario: Inicio de sesión correcto
- **WHEN** el usuario introduce credenciales válidas
- **THEN** el diálogo se cierra y la interfaz muestra la sesión activa

#### Scenario: Error de credenciales
- **WHEN** las credenciales son incorrectas
- **THEN** se muestra el mensaje de error sin cerrar el diálogo

#### Scenario: Registro con confirmación
- **WHEN** el registro requiere confirmación por email
- **THEN** se informa al usuario de que revise su correo

### Requirement: Degradación sin credenciales
Si faltan las credenciales de Supabase, el sistema SHALL no romper la interfaz y SHALL mantener el modo anónimo, avisando de forma no bloqueante en las funciones que dependan de la cuenta.

#### Scenario: Sin variables de entorno
- **WHEN** no existen `PUBLIC_SUPABASE_URL` o `PUBLIC_SUPABASE_ANON_KEY`
- **THEN** la navegación funciona en modo anónimo y las funciones de cuenta muestran un aviso amable

### Requirement: Cierre de sesión
El sistema SHALL permitir cerrar la sesión desde el menú de usuario y SHALL actualizar la interfaz en consecuencia.

#### Scenario: Cerrar sesión
- **WHEN** el usuario pulsa «Cerrar sesión»
- **THEN** se cierra la sesión y la interfaz vuelve al estado anónimo
