-- =============================================================
-- Fase 3 — Grupo A: Datos semilla
-- Ejecutar DESPUÉS de 001_schema.sql
-- =============================================================

-- Mysteries
INSERT INTO mysteries (id, code, title, short_title, category, context, contributors, mentions_count, display_order)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'M-001', '¿POR QUÉ TABITHA DORMÍA CAMINANDO?', 'Sonambulismo de Tabitha', 'mechanic',
   'Tabitha caminaba dormida hacia el árbol de lejanía siendo niña. Este comportamiento se repitió en Fromville y parece conectado con su rol en el ciclo del sacrificio.',
   '3 creadores', 12, 1),

  ('a1000000-0000-0000-0000-000000000002', 'M-002', '¿QUIÉNES SON LOS NIÑOS DE "ANGK HOOEY"?', 'Los niños de Anghkooey', 'entity',
   'Los niños parecen ser las víctimas del sacrificio original. Su nombre "Anghkooey" aparece repetido y parece ser una palabra clave del ritual.',
   '5 creadores', 28, 2),

  ('a1000000-0000-0000-0000-000000000003', 'M-003', '¿QUIÉN ES EL HOMBRE DE AMARILLO?', 'Identidad del Hombre de Amarillo', 'entity',
   'La entidad principal que adopta formas humanas y manipula a los habitantes. Su verdadera naturaleza sigue siendo el misterio central de la serie.',
   '6 creadores', 35, 3),

  ('a1000000-0000-0000-0000-000000000004', 'M-004', '¿CÓMO FUNCIONA EL FARAWAY TREE?', 'Mecánica del árbol de lejanía', 'origin',
   'El árbol transporta personas a lugares aleatorios de Fromville. Su comportamiento parece tener reglas internas que aún no se comprenden completamente.',
   '4 creadores', 18, 4),

  ('a1000000-0000-0000-0000-000000000005', 'M-005', '¿POR QUÉ LOS MONSTRUOS SOLO SALEN DE NOCHE?', 'Regla nocturna de los monstruos', 'mechanic',
   'Los monstruos respetan una regla estricta: solo pueden atacar durante la noche. Los talismanes protegen las casas, pero la razón de esta limitación es un misterio.',
   '3 creadores', 15, 5),

  ('a1000000-0000-0000-0000-000000000006', 'M-006', '¿DE DÓNDE SALIERON LOS TALISMANES?', 'Origen de los talismanes', 'origin',
   'Boyd encontró los talismanes en un cave. Su origen y por qué funcionan como protección contra los monstruos sigue sin explicarse del todo.',
   '4 creadores', 20, 6);

-- Hypotheses
INSERT INTO hypotheses (id, mystery_id, title, description, author, votes_count, display_order)
VALUES
  -- M-001: Tabitha
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'El árbol la llamaba',
   'El Faraway Tree tenía un vínculo activo con Tabitha y la atraía físicamente durante el sueño para guiarla hacia el portal.', 'Canal', 45, 1),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Reencarnación activada',
   'El sonambulismo era el mecanismo por el que la Tabitha original recordaba parcialmente su papel anterior en el sacrificio.', 'Comunidad', 32, 2),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Protección inconsciente',
   'Su mente intentaba protegerla recordándole que debía volver al árbol para completar la misión que dejó pendiente.', 'Comunidad', 18, 3),

  -- M-002: Anghkooey
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Niños sacrificados',
   'Son los espíritus de los niños que fueron sacrificados en el ritual original y quedaron atrapados en Fromville.', 'Canal', 67, 1),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Niños reencarnados',
   'Algunos personajes actuales podrían ser reencarnaciones de estos niños, traídos de vuelta para completar el ciclo.', 'Comunidad', 41, 2),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'Guardianes del árbol',
   'Los niños no son víctimas sino guardianes que protegen el árbol de lejanía y guían a los elegidos.', 'Comunidad', 15, 3),

  -- M-003: Hombre de Amarillo
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'Dios local de Fromville',
   'Es la entidad creadora del lugar, un ser que existe desde antes del sacrificio y que alimenta el ciclo.', 'Canal', 89, 1),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003', 'Primer habitante',
   'Fue el primer ser humano atrapado en Fromville que acumuló poder suficiente para transformarse.', 'Comunidad', 54, 2),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000003', 'Manifestación colectiva',
   'No es un ser individual sino la materialización del miedo colectivo de todos los habitantes atrapados.', 'Comunidad', 23, 3),

  -- M-004: Faraway Tree
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000004', 'Portal bidireccional',
   'El árbol no solo transporta sino que también puede traer cosas de fuera, explicando las llegadas de nuevos habitantes.', 'Canal', 38, 1),
  ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000004', 'Red de ubicaciones',
   'Existe un mapa oculto de puntos de llegada que el árbol sigue según reglas que desconocemos.', 'Comunidad', 27, 2),
  ('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000004', 'Transporte selectivo',
   'El árbol elige a quién transportar y hacia dónde, basándose en el rol de la persona en el ciclo del sacrificio.', 'Comunidad', 19, 3),

  -- M-005: Monstruos nocturnos
  ('b1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000005', 'Debilidad solar',
   'La luz del sol los debilita físicamente, como una versión extrema de los vampiros clásicos.', 'Comunidad', 42, 1),
  ('b1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000005', 'Regla del ritual',
   'Fue una de las condiciones impuestas por el sacrificio original: no pueden matar de día.', 'Canal', 56, 2),
  ('b1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000005', 'Ciclo de alimentación',
   'Solo necesitan alimentarse durante la noche porque la energía vital es más "pura" en la oscuridad.', 'Comunidad', 14, 3),

  -- M-006: Talismanes
  ('b1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000006', 'Restos del ritual',
   'Son fragmentos de las piedras utilizadas en el sacrificio original que absorbieron energía protectora.', 'Canal', 51, 1),
  ('b1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000006', 'Creación de Boyd',
   'Boyd los creó inconscientemente usando su fe, como los monstruos fueron creados por el miedo.', 'Comunidad', 29, 2),
  ('b1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000006', 'Herramienta de la entidad',
   'Los talismanes no protegen sino que dirigen a los monstruos, controlando dónde y cuándo atacan.', 'Comunidad', 21, 3);
