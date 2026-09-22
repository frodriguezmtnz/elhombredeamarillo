# trivial-game Specification

## Purpose
Define el juego de preguntas sobre FROM: selección de prueba, generación del mazo, puntuación, temporizador, cuenta atrás, resultados y publicación de marcas en el tablón verificado.

## Requirements

### Requirement: Selección de prueba
El sistema SHALL ofrecer varias formas de iniciar la partida: tres modos principales (Rápido, Experto y Sin spoilers), selección por temporada y selección por categoría. Cada modo SHALL indicar cuántas preguntas se jugarán.

#### Scenario: Inicio en modo Rápido
- **WHEN** el usuario pulsa el modo «Rápido»
- **THEN** se genera un mazo de 10 preguntas variadas de todo el banco y comienza la cuenta atrás

#### Scenario: Inicio sin spoilers
- **WHEN** el usuario elige el modo «Sin spoilers»
- **THEN** el mazo solo incluye preguntas con `spoilersUpTo` igual a 0

#### Scenario: Inicio por temporada
- **WHEN** el usuario pulsa «Hasta TN»
- **THEN** el mazo solo incluye preguntas cuyo `spoilersUpTo` sea menor o igual a N

### Requirement: Identificación previa del jugador
Antes de elegir modo, el sistema SHALL solicitar un alias de jugador y SHALL permitir continuar como «Anónimo». El alias SHALL recordarse en el dispositivo para futuras partidas.

#### Scenario: Confirmar alias
- **WHEN** el usuario escribe un alias y pulsa «Continuar»
- **THEN** la selección de modo se habilita y el alias queda guardado en el dispositivo

#### Scenario: Jugar como anónimo
- **WHEN** el usuario pulsa «Jugar como Anónimo»
- **THEN** la partida se habilita firmando como «Anónimo»

### Requirement: Mazo barajado y sin repetición en sesión
El sistema SHALL construir el mazo en el cliente barajando el orden de las preguntas y el de las opciones de cada pregunta. Al continuar una sesión, el sistema SHALL excluir las preguntas ya jugadas y SHALL permitir repetirlas solo si el banco filtrado se agota.

#### Scenario: Opciones barajadas
- **WHEN** se construye el mazo
- **THEN** el orden de las opciones de cada pregunta es aleatorio e independiente del orden original

#### Scenario: Continuar sin repetir
- **WHEN** el usuario pulsa «Continuar la racha»
- **THEN** el nuevo mazo excluye las preguntas ya jugadas y conserva puntos y racha

#### Scenario: Banco agotado
- **WHEN** no quedan preguntas nuevas para los filtros activos
- **THEN** el sistema permite repetir preguntas del banco filtrado en lugar de no ofrecer partida

### Requirement: Temporizador por dificultad con aviso visual
El sistema SHALL asignar un tiempo límite por pregunta según su dificultad (15 s fácil, 20 s media, 30 s difícil). El tiempo restante SHALL mostrarse con un contador destacado que cambie de color según la urgencia (amarillo por defecto, naranja desde 10 s y rojo desde 5 s) y con un pulso en los últimos segundos.

#### Scenario: Cambio de color del contador
- **WHEN** el tiempo restante baja a 10 s o menos
- **THEN** el contador y la barra pasan a naranja; al bajar a 5 s o menos, a rojo con pulso

#### Scenario: Tiempo agotado
- **WHEN** el temporizador llega a 0 sin respuesta
- **THEN** la pregunta se marca como «se hizo de noche», no suma puntos y se muestra la explicación

### Requirement: Puntuación por dificultad, velocidad y racha
El sistema SHALL puntuar cada acierto como base por dificultad más un bonus de velocidad normalizado por el tiempo restante y un bonus por racha. Una respuesta incorrecta o agotada SHALL no sumar puntos y SHALL reiniciar la racha.

#### Scenario: Acierto rápido
- **WHEN** el usuario acierta con la mayor parte del tiempo disponible
- **THEN** el bonus de velocidad es proporcionalmente alto respecto al límite de la pregunta

#### Scenario: Fallo
- **WHEN** el usuario responde mal o se queda sin tiempo
- **THEN** la racha vuelve a 0 y no se suman puntos

### Requirement: Cuenta atrás de toque de queda con campana
Al iniciar la partida, el sistema SHALL mostrar una pantalla de cuenta atrás a pantalla completa con fondo opaco, la campana de Boyd visible durante todo el proceso, una intro de unos 10 segundos y una cuenta atrás de 5 segundos. La campana SHALL sonar en bucle y fundirse a silencio al terminar. La pantalla SHALL poder saltarse con clic, `Enter`, `Espacio` o `Esc`.

#### Scenario: Campana durante la cuenta atrás
- **WHEN** la cuenta atrás avanza por los números 5·4·3·2·1
- **THEN** la campana permanece visible y sigue sonando hasta fundirse justo antes de mostrar «¡A JUGAR!»

#### Scenario: Saltar la cuenta atrás
- **WHEN** el usuario hace clic o pulsa `Enter`, `Espacio` o `Esc`
- **THEN** la partida comienza de inmediato con un fundido corto de la campana

### Requirement: Atajos de teclado durante el juego
El sistema SHALL permitir responder con las teclas `1`-`4` o `A`-`D` y avanzar con `Enter` o `Espacio` una vez respondida la pregunta.

#### Scenario: Responder con teclado
- **WHEN** el usuario pulsa una tecla de opción válida antes de responder
- **THEN** se registra esa respuesta como si hubiera pulsado la opción

#### Scenario: Avanzar con teclado
- **WHEN** el usuario ya ha respondido y pulsa `Enter` o `Espacio`
- **THEN** se pasa a la siguiente pregunta (o al expediente final si era la última)

### Requirement: Explicación reforzada con imagen y enlaces
Tras responder, el sistema SHALL mostrar la explicación de la pregunta y, cuando existan, SHALL mostrar una imagen asociada y una lista de enlaces externos que amplían la información.

#### Scenario: Pregunta con imagen
- **WHEN** la pregunta tiene `image`
- **THEN** la explicación se acompaña de esa imagen con su texto alternativo

#### Scenario: Pregunta con enlaces
- **WHEN** la pregunta tiene `links`
- **THEN** se muestran como enlaces externos que se abren en una pestaña nueva

### Requirement: Resultados y fin de partida
Al terminar el mazo, el sistema SHALL mostrar un resumen con puntuación, aciertos, precisión, mejor racha, rango y una bitácora pregunta a pregunta (con miniatura cuando la pregunta tenga imagen). El sistema SHALL ofrecer continuar la racha, reintentar la prueba y cambiar de prueba.

#### Scenario: Continuar la racha
- **WHEN** el usuario pulsa «Continuar la racha»
- **THEN** se juega un mazo nuevo sin repetir preguntas y el marcador se acumula sobre la sesión

#### Scenario: Reintentar
- **WHEN** el usuario pulsa «Reintentar prueba»
- **THEN** se empieza de cero con un mazo re-barajado del mismo modo

### Requirement: Tablón del pueblo verificado
El sistema SHALL permitir publicar la marca de la partida en el tablón solo con sesión iniciada, firmando con el alias. El tablón SHALL listar las mejores marcas por semana o histórico, permitir borrar las marcas propias y reflejar las nuevas publicaciones en tiempo real. El tablón SHALL mostrarse en la selección de prueba y en los resultados, pero no durante la partida.

#### Scenario: Publicar requiere cuenta
- **WHEN** el usuario sin sesión intenta publicar su marca
- **THEN** se le ofrece iniciar sesión o crear cuenta

#### Scenario: Tablón oculto durante el juego
- **WHEN** la partida está en curso (cuenta atrás o preguntas)
- **THEN** el tablón no se renderiza

#### Scenario: Sin credenciales de Supabase
- **WHEN** el tablón no puede cargar por falta de credenciales
- **THEN** se muestra un aviso discreto en lugar de un error de sistema
