import type { CasesMeta, DossierData, SourceData } from '@lib/types';

export const CASES_META: CasesMeta = {
  title: 'Archivo de teorías de FROM',
  baseTheories: 6,
  transcribedVideos: 14,
  note: 'Las fichas distinguen entre pistas de la serie, interpretaciones del canal y posibilidades alternativas. No presentan las teorías como hechos confirmados.'
};

export const DOSSIERS: DossierData[] = [
  {
    id: 'fromville-pocket',
    number: '001',
    category: 'origin',
    categoryLabel: 'ORIGEN DE FROMVILLE',
    status: 'HIPÓTESIS CENTRAL',
    statusTone: 'core',
    title: 'FROMVILLE ES UN UNIVERSO DE BOLSILLO',
    shortTitle: 'Universo de bolsillo',
    summary: 'Fromville sería un espacio artificial y limitado contenido dentro de nuestra realidad, creado o deformado por el sacrificio original.',
    thesis: 'El árbol de la carretera funcionaría como portal de entrada a un universo pequeño con leyes propias. El bucle espacial, la electricidad imposible, la curación acelerada y la superposición temporal se interpretan como síntomas de ese espacio artificial. La versión más amplia conecta su origen con una entidad llegada en un meteorito, las rocas rojas y la energía liberada por el sacrificio de los niños.',
    evidence: [
      { title: 'PORTAL DE ENTRADA', text: 'Todas las llegadas se producen después del encuentro con el árbol de la carretera, que actuaría como paso entre realidades.' },
      { title: 'ESPACIO CERRADO', text: 'La carretera devuelve siempre al mismo punto, como si el territorio disponible fuera limitado y estuviera plegado sobre sí mismo.' },
      { title: 'LEYES ANÓMALAS', text: 'La electricidad sin fuente, la curación acelerada y ciertos viajes temporales sugieren reglas físicas distintas.' },
      { title: 'ORIGEN CÓSMICO', text: 'Las rocas rojas, el aura de la entidad y el sacrificio se conectan en una posible creación artificial de Fromville.' }
    ],
    doubts: [
      'La relación entre meteorito, rocas rojas y entidad es una ampliación especulativa con pocas pruebas directas.',
      'Que Fromville tenga reglas anómalas no demuestra por sí solo que sea literalmente un universo de bolsillo.',
      'La teoría explica bien el escenario, pero todavía no determina quién lo creó ni con qué límites.'
    ],
    tags: ['árbol de la carretera', 'bucle', 'rocas rojas', 'meteorito', 'tiempo', 'electricidad'],
    sourceIds: ['src-pocket', 'src-e2', 'src-e7', 'src-trailer-e10'],
    related: ['unfinished-sacrifice', 'life-energy-cycle', 'living-nightmares', 'jade-caves']
  },
  {
    id: 'white-boy-tree',
    number: '002',
    category: 'entity',
    categoryLabel: 'ENTIDADES',
    status: 'ALTERNATIVA ABIERTA',
    statusTone: 'open',
    title: 'EL NIÑO DE BLANCO ES EL ÁRBOL DE LEJANÍA',
    shortTitle: 'Niño de Blanco = árbol',
    summary: 'El Niño de Blanco podría ser la manifestación consciente del Faraway Tree, nacida de la esperanza depositada por los niños en sus raíces.',
    thesis: 'Sus primeras apariciones están ligadas a árboles de lejanía y su función de guía reproduce el poder de transporte del árbol. Su apariencia infantil sería una forma idealizada de la esperanza de los niños sacrificados. Incluso sus actos más crueles se reinterpretan como ayudas difíciles de comprender desde fuera.',
    evidence: [
      { title: 'APARICIONES CONECTADAS', text: 'Varias de sus primeras intervenciones conducen directamente a Víctor, Julie, Boyd o Sara hacia un árbol de lejanía.' },
      { title: 'MISMA FUNCIÓN', text: 'El niño aparece, desaparece y guía; el árbol desplaza a las personas y decide dónde terminan.' },
      { title: 'ESPERANZA EN LAS RAÍCES', text: 'La esperanza de los niños habría alimentado el árbol, explicando por qué una entidad vinculada a él intenta ayudarlos.' },
      { title: 'PATRÓN DE ELEGIDOS', text: 'Desaparece cuando no hay personas capaces de continuar la misión y vuelve con la llegada de Tabitha, Jade y la familia Matthews.' }
    ],
    doubts: [
      'También se plantea que sea un antiguo niño fallecido, relacionado con el dibujo inicial, su hermana y el perro.',
      'Enviar a Dale a la piscina exige una reinterpretación muy extrema de la idea de ayuda.',
      'La conexión con el árbol es fuerte, pero conexión no equivale necesariamente a identidad.'
    ],
    tags: ['Niño de Blanco', 'Faraway Tree', 'Víctor', 'esperanza', 'elegidos', 'perro'],
    sourceIds: ['src-white-boy', 'src-jade-plan', 'src-e4'],
    related: ['jade-caves', 'unfinished-sacrifice', 'ritual-weapons', 'living-nightmares']
  },
  {
    id: 'jade-caves',
    number: '003',
    category: 'exit',
    categoryLabel: 'SALIDA Y RESOLUCIÓN',
    status: 'EN EVOLUCIÓN',
    statusTone: 'core',
    title: 'EL PLAN DE JADE Y LA SOLUCIÓN BAJO TIERRA',
    shortTitle: 'Plan de Jade y cuevas',
    summary: 'Las cuevas y el Lago de las Lágrimas serían la verdadera zona de resolución, aunque la visión que impulsa el plan podría ser una trampa.',
    thesis: 'El árbol podría servir para recordar, no para escapar. La solución real estaría bajo tierra: liberar los restos de los niños, descubrir el lago subterráneo o alcanzar una capa más profunda de Fromville. La presencia de arañas durante la visión de Jade abre una lectura opuesta: el Hombre de Amarillo podría estar guiando el plan para que fracase de una forma concreta.',
    evidence: [
      { title: 'PISTAS HACIA ABAJO', text: 'El libro sobre cómo entra la luz, el anillo que cae por las escaleras y la mano que surge de la tierra repiten una dirección descendente.' },
      { title: 'AGUA SUBTERRÁNEA', text: 'La lluvia se filtra en las cuevas y el goteo en zonas profundas permite imaginar un acuífero o Lago de las Lágrimas bajo Fromville.' },
      { title: 'RESTOS DE LOS NIÑOS', text: 'El plan de Jade convierte los huesos y la sala del sacrificio en objetivos físicos que podrían liberar o fijar a los niños.' },
      { title: 'ARAÑAS Y MANIPULACIÓN', text: 'Las arañas de la visión pueden señalar que la entidad intervino en la experiencia para conducir al grupo hasta una trampa.' }
    ],
    doubts: [
      'El documento mantiene abiertas dos lecturas incompatibles: salida real o manipulación de la entidad.',
      'No está confirmado que el Lago de las Lágrimas sea un lugar físico ni que se encuentre bajo tierra.',
      'Extraer los huesos puede ser insuficiente si el sacrificio también afectó a las almas, la esperanza o los cuerpos consumidos.'
    ],
    tags: ['Jade', 'cuevas', 'Lago de las Lágrimas', 'huesos', 'arañas', 'salida'],
    sourceIds: ['src-jade-plan', 'src-e6', 'src-e7', 'src-e9', 'src-trailer-e10'],
    related: ['white-boy-tree', 'unfinished-sacrifice', 'ritual-weapons', 'fromville-pocket']
  },
  {
    id: 'unfinished-sacrifice',
    number: '004',
    category: 'origin',
    categoryLabel: 'ORIGEN DE FROMVILLE',
    status: 'HIPÓTESIS CENTRAL',
    statusTone: 'core',
    title: 'EL SACRIFICIO NUNCA TERMINÓ',
    shortTitle: 'Sacrificio incompleto',
    summary: 'La esperanza de los niños escapó hacia el árbol y dejó el ritual abierto, obligando a Fromville a repetir ciclos para intentar completarlo.',
    thesis: 'Los habitantes originales habrían obtenido una forma de inmortalidad, mientras Tabitha y Jade regresan como reencarnaciones por haber intentado impedir el pacto. La hipótesis amplía el ciclo: otros personajes podrían ser reencarnaciones de los niños sacrificados, traídos de nuevo para que la entidad destruya la esperanza que no pudo absorber la primera vez.',
    evidence: [
      { title: 'ESPERANZA DESVIADA', text: 'La esperanza de los niños se habría depositado en las raíces del árbol en vez de alimentar por completo a la entidad.' },
      { title: 'CICLOS REPETIDOS', text: 'El reinicio constante del pueblo sería el intento de corregir un sacrificio que quedó incompleto.' },
      { title: 'ROMPER ANTES QUE MATAR', text: 'La entidad dedica tiempo a destruir psicológicamente a ciertos personajes, como si necesitara agotar su esperanza.' },
      { title: 'ROLES SIN RESOLVER', text: 'Boyd, Abby, Elgin o Sara podrían ocupar lugares de la historia original todavía no identificados.' }
    ],
    doubts: [
      'La reencarnación de Tabitha y Jade no implica automáticamente que todos los personajes relevantes también se reencarnen.',
      'La teoría mezcla una explicación del ciclo con una identificación concreta de los niños que todavía no puede comprobarse.',
      'No se sabe qué condiciones exactas permitirían completar o revertir el sacrificio.'
    ],
    tags: ['sacrificio', 'niños Anghkooey', 'reencarnación', 'esperanza', 'ciclos', 'Tabitha'],
    sourceIds: ['src-sacrifice', 'src-pocket', 'src-e2', 'src-e7'],
    related: ['fromville-pocket', 'white-boy-tree', 'life-energy-cycle', 'ritual-weapons', 'jade-caves']
  },
  {
    id: 'ritual-weapons',
    number: '005',
    category: 'ritual',
    categoryLabel: 'OBJETOS Y RITUALES',
    status: 'TEORÍA DERIVADA',
    statusTone: 'open',
    title: 'TALISMANES Y TÓTEMS SON ARMAS DEL RITUAL',
    shortTitle: 'Talismanes y tótems',
    summary: 'Su poder podría proceder de materiales que absorbieron la esperanza o la energía del sacrificio original.',
    thesis: 'Los tótems podrían estar tallados con madera del árbol de lejanía, mientras los talismanes podrían proceder de las piedras utilizadas en el sacrificio. En ambos casos, su capacidad para proteger o dañar dependería de contener la misma energía que la entidad intenta consumir.',
    evidence: [
      { title: 'MADERA DEL ÁRBOL', text: 'Las ramas aparentemente arrancadas del Faraway Tree permiten imaginar que parte de su madera se usó para fabricar tótems o armas.' },
      { title: 'PIEDRAS AUSENTES', text: 'Las siete piedras del ritual no aparecen en la sala actual y podrían haber sido transformadas en talismanes.' },
      { title: 'ENERGÍA COMPARTIDA', text: 'Árbol, niños y objetos quedarían conectados por la esperanza liberada durante el sacrificio.' },
      { title: 'PRUEBAS EN T4', text: 'Los personajes convierten los tótems en lanzas y los prueban contra los monstruos, aunque el resultado obliga a revisar la hipótesis.' }
    ],
    doubts: [
      'La procedencia material de los objetos no está confirmada.',
      'Un tótem puede funcionar contra una criatura concreta y fallar contra los monstruos habituales.',
      'La protección podría depender del espacio cerrado o de reglas rituales, no solo del material.'
    ],
    tags: ['talismanes', 'tótems', 'madera', 'piedras', 'armas', 'protección'],
    sourceIds: ['src-e6', 'src-e7', 'src-e9', 'src-trailer-e10'],
    related: ['white-boy-tree', 'unfinished-sacrifice', 'jade-caves', 'life-energy-cycle']
  },
  {
    id: 'jade-villain',
    number: '006',
    category: 'character',
    categoryLabel: 'PERSONAJES',
    status: 'REINTERPRETACIÓN',
    statusTone: 'warning',
    title: 'JADE ES EL VERDADERO VILLANO',
    shortTitle: 'Jade, villano oculto',
    summary: 'Una lectura deliberadamente extrema reinterpreta a Jade y Christopher como manipuladores vinculados al sacrificio.',
    thesis: 'La teoría reúne el miedo de Miranda a Christopher, la ausencia de peticiones de "recuerda" dirigidas a Jade, la marioneta Jasper, el doble sentido de "play", la llegada con Toby y varias conexiones francesas. El propio autor termina aclarando que no la considera una predicción probable, sino un ejercicio para revisar escenas desde otro punto de vista.',
    evidence: [
      { title: 'CHRISTOPHER GENERABA MIEDO', text: 'Miranda ocultó a sus hijos en un lugar que Christopher no conocía y Víctor lo recuerda como una amenaza.' },
      { title: 'JASPER Y LOS HILOS', text: 'La marioneta se convierte en metáfora de un personaje que podría manipular a otros desde la sombra.' },
      { title: 'TOBY COMO TESTIGO', text: 'La llegada de Jade se reinterpreta a partir de que Toby apenas lo menciona y es eliminado poco después.' },
      { title: 'FRANCIA, MÚSICA Y PAYASO', text: 'El origen francés de Jade, el violín, el ballet y las pinturas se conectan como una red simbólica.' }
    ],
    doubts: [
      'El propio creador declara al final que no cree que la teoría sea cierta.',
      'Varias pruebas dependen de juegos de palabras, ausencias de diálogo o asociaciones simbólicas muy abiertas.',
      'La teoría sigue siendo útil para señalar que el comportamiento de Christopher aún necesita una explicación.'
    ],
    tags: ['Jade', 'Christopher', 'Jasper', 'Toby', 'Francia', 'violín'],
    sourceIds: ['src-jade-villain', 'src-e2', 'src-e9'],
    related: ['unfinished-sacrifice', 'jade-caves', 'objects-memory']
  },
  {
    id: 'shapeshifter',
    number: '007',
    category: 'entity',
    categoryLabel: 'ENTIDADES',
    status: 'HIPÓTESIS ABIERTA',
    statusTone: 'open',
    title: 'EL HOMBRE DE AMARILLO ES UN CAMBIAFORMAS',
    shortTitle: 'El cambiaformas',
    summary: 'La entidad podría adoptar formas humanas completas, diferenciadas de las simples visiones que solo percibe un personaje.',
    thesis: 'La teoría distingue apariciones espectrales —como el Padre Khatri o Tom— de presencias físicas que pueden ser vistas por más de una persona. Abby y Martin aparecen como candidatos principales a formas robadas por la entidad. Más adelante, las transformaciones de Sofía y las promesas hechas a otros personajes amplían esta línea.',
    evidence: [
      { title: 'VISIÓN FRENTE A CUERPO', text: 'Cuando otros personajes ven a la aparición o interactúan con ella, podría tratarse de una forma física y no de una alucinación privada.' },
      { title: 'ABBY', text: 'Su recuerdo del lugar, su cambio de conducta y ciertas apariciones posteriores permiten sospechar una sustitución o imitación.' },
      { title: 'MARTIN', text: 'Julie también lo ve y su conocimiento sobre Boyd y la caja de música lo sitúa por encima de una visión ordinaria.' },
      { title: 'SOFÍA Y OTRAS FORMAS', text: 'Las transcripciones de T4 desarrollan la idea de que el Hombre de Amarillo elige una apariencia distinta para cada objetivo.' }
    ],
    doubts: [
      'No todas las visiones tienen que proceder de la misma entidad.',
      'La presencia de dos testigos tampoco prueba por sí sola una sustitución de identidad.',
      'La teoría necesita reglas claras: qué objetos, recuerdos o cuerpos permiten adoptar una forma.'
    ],
    tags: ['Hombre de Amarillo', 'Sofía', 'Abby', 'Martin', 'formas', 'visiones'],
    sourceIds: ['src-shapeshifter', 'src-e4', 'src-e6', 'src-e9', 'src-t5'],
    related: ['objects-memory', 'living-nightmares', 'life-energy-cycle']
  },
  {
    id: 'living-nightmares',
    number: '008',
    category: 'mechanic',
    categoryLabel: 'REGLAS DE FROMVILLE',
    status: 'MARCO EXPLICATIVO',
    statusTone: 'core',
    title: 'FROMVILLE MATERIALIZA LAS PESADILLAS',
    shortTitle: 'Pesadillas materializadas',
    summary: 'Los elementos que parecen no conectar podrían proceder de miedos y relatos diferentes convertidos en realidad por el lugar.',
    thesis: 'Las cigarras, gusanos, monstruos y otras amenazas no formarían una mitología uniforme porque serían pesadillas extraídas de distintas personas. Fromville reutilizaría temores, palabras, cuentos y anticipaciones para construir nuevas reglas o criaturas. Esto explica la variedad, pero también plantea si los personajes crean el futuro o si simplemente lo presagian.',
    evidence: [
      { title: 'CIGARRAS DE NATHAN', text: 'Sara plantea que las cigarras podrían proceder del miedo de su hermano y haber sido reutilizadas después de su muerte.' },
      { title: 'PALABRAS QUE SE CUMPLEN', text: 'Conversaciones sobre gusanos, miedos y relatos parecen anticipar elementos que más tarde aparecen físicamente.' },
      { title: 'MITOLOGÍAS INCOMPATIBLES', text: 'La diversidad de amenazas deja de ser un error de conexión si cada una tiene un origen psicológico diferente.' },
      { title: 'CREACIÓN O DESTINO', text: 'La teoría mantiene abierta la duda de si Fromville copia pensamientos o si los personajes recuerdan sin saberlo algo que ya ocurrirá.' }
    ],
    doubts: [
      'Algunas coincidencias pueden ser presagios narrativos y no una regla interna del mundo.',
      'No explica por qué ciertos miedos se materializan y otros no.',
      'Debe encajar con el sacrificio original y con entidades que parecen existir antes de los habitantes actuales.'
    ],
    tags: ['pesadillas', 'cigarras', 'gusanos', 'miedos', 'relatos', 'materialización'],
    sourceIds: ['src-nightmares', 'src-e2', 'src-jade-plan'],
    related: ['fromville-pocket', 'white-boy-tree', 'shapeshifter', 'objects-memory']
  },
  {
    id: 'life-energy-cycle',
    number: '009',
    category: 'mechanic',
    categoryLabel: 'REGLAS DE FROMVILLE',
    status: 'TEORÍA EN DESARROLLO',
    statusTone: 'open',
    title: 'LAS MUERTES ALIMENTAN LA INMORTALIDAD',
    shortTitle: 'Energía vital del ciclo',
    summary: 'La energía de quienes mueren en Fromville podría transferirse a los monstruos y mantener activo el ciclo.',
    thesis: 'La resurrección de Roger mediante el sacrificio de un pollito se interpreta como una demostración de intercambio vital: una vida paga otra. A partir de ahí, las personas atrapadas y asesinadas serían la fuente constante que sostiene la inmortalidad de los monstruos, del Hombre de Amarillo o del propio lugar.',
    evidence: [
      { title: 'INTERCAMBIO DE VIDAS', text: 'El huevo y la resurrección de Roger visualizan que la energía no aparece gratis y que una vida puede transformarse en otra.' },
      { title: 'MUERTOS ATRAPADOS', text: 'Si quienes mueren no abandonan Fromville, su energía podría quedar disponible para el sistema.' },
      { title: 'CICLOS COMO COMBUSTIBLE', text: 'La llegada repetida de habitantes garantiza una entrada continua de vida, sufrimiento y esperanza.' },
      { title: 'CONSUMO DE CUERPOS', text: 'El Hombre de Amarillo consumiendo órganos se relaciona con una absorción directa de energía vital.' }
    ],
    doubts: [
      'La resurrección concreta no demuestra que todas las muertes funcionen del mismo modo.',
      'No se sabe si el recurso buscado es vida, esperanza, miedo o una combinación.',
      'Debe distinguirse entre la energía que mantiene a los monstruos y la que sostiene el espacio de Fromville.'
    ],
    tags: ['energía vital', 'inmortalidad', 'Roger', 'huevo', 'monstruos', 'ciclos'],
    sourceIds: ['src-e7', 'src-e4', 'src-sacrifice', 'src-pocket'],
    related: ['unfinished-sacrifice', 'fromville-pocket', 'ritual-weapons', 'shapeshifter']
  },
  {
    id: 'objects-memory',
    number: '010',
    category: 'ritual',
    categoryLabel: 'OBJETOS Y RITUALES',
    status: 'PISTA RECURRENTE',
    statusTone: 'open',
    title: 'LOS OBJETOS CONSERVAN IDENTIDAD Y RECUERDOS',
    shortTitle: 'Objetos y memoria',
    summary: 'Los objetos personales podrían retener una parte de sus dueños, activar recuerdos y permitir que la entidad imite apariencias.',
    thesis: 'Las pertenencias guardadas por Víctor, las gafas, los anillos, las pulseras repetidas y las máquinas de recuerdos forman una línea común: los objetos mantienen un vínculo con las personas. Esta regla podría explicar tanto la recuperación de memorias como la capacidad del Hombre de Amarillo para adoptar formas ajenas.',
    evidence: [
      { title: 'ARCHIVO DE VÍCTOR', text: 'El Niño de Blanco le pide conservar objetos de los fallecidos, convirtiéndolos en sustitutos de la memoria del pueblo.' },
      { title: 'OBJETOS REPETIDOS', text: 'Pulseras y anillos similares aparecen ligados a reencarnaciones o vidas que repiten patrones.' },
      { title: 'RECORDAR PERMITE VOLVER', text: 'La aparición física del Hombre de Amarillo se relaciona con el momento en que Jade y Tabitha recuperan recuerdos.' },
      { title: 'ROBO DE APARIENCIAS', text: 'Si un objeto contiene una parte de su dueño, la entidad podría usarlo como acceso a su forma o identidad.' }
    ],
    doubts: [
      'La importancia emocional de un objeto no implica necesariamente que contenga literalmente un alma.',
      'Algunas repeticiones pueden deberse a los ciclos o reencarnaciones y no a propiedades mágicas del objeto.',
      'Falta una demostración directa de que la entidad necesite pertenencias para transformarse.'
    ],
    tags: ['objetos', 'memoria', 'Víctor', 'pulsera', 'anillo', 'identidad'],
    sourceIds: ['src-e2', 'src-e4', 'src-shapeshifter'],
    related: ['shapeshifter', 'jade-villain', 'living-nightmares']
  }
];

export const SOURCES: SourceData[] = [
  {
    id: 'src-nightmares', order: 1, phase: 'ARCHIVO BASE', code: 'TEORÍA', kind: 'theory',
    title: 'FROM Serie Teorías | NADA CONECTA POR ESTE MOTIVO.',
    summary: 'Propone que la variedad de amenazas procede de pesadillas, miedos y relatos diferentes materializados por Fromville.',
    dossiers: ['living-nightmares', 'objects-memory'],
    searchTitle: 'FROM Serie Teorías NADA CONECTA POR ESTE MOTIVO'
  },
  {
    id: 'src-pocket', order: 2, phase: 'ARCHIVO BASE', code: 'TEORÍA', kind: 'theory',
    title: 'Dale tenía razón sobre el origen de FROM | FROM Serie Teoría',
    summary: 'Formula el universo de bolsillo y lo conecta con el portal, el bucle espacial, las rocas rojas, el sacrificio y un posible final que encierre a la entidad.',
    dossiers: ['fromville-pocket', 'unfinished-sacrifice', 'life-energy-cycle'],
    searchTitle: 'Dale tenía razón sobre el origen de FROM'
  },
  {
    id: 'src-shapeshifter', order: 3, phase: 'ARCHIVO BASE', code: 'TEORÍA', kind: 'theory',
    title: 'El cambia-formas LO CAMBIA TODO | FROM Serie Temporada 4',
    summary: 'Diferencia visiones y apariciones físicas para estudiar si Abby y Martin fueron formas adoptadas por el Hombre de Amarillo.',
    dossiers: ['shapeshifter', 'objects-memory'],
    searchTitle: 'El cambia-formas LO CAMBIA TODO FROM Serie Temporada 4'
  },
  {
    id: 'src-white-boy', order: 4, phase: 'ARCHIVO BASE', code: 'TEORÍA', kind: 'theory',
    title: 'LA IDENTIDAD DEL NIÑO DE BLANCO OS VOLARÁ LA CABEZA | FROM Serie Teoría',
    summary: 'Construye la identificación entre el Niño de Blanco y el Faraway Tree y conserva una teoría alternativa sobre el niño del opening.',
    dossiers: ['white-boy-tree', 'unfinished-sacrifice'],
    searchTitle: 'LA IDENTIDAD DEL NIÑO DE BLANCO OS VOLARÁ LA CABEZA FROM Serie Teoría'
  },
  {
    id: 'src-sacrifice', order: 5, phase: 'ARCHIVO BASE', code: 'TEORÍA', kind: 'theory',
    title: 'EL SACRIFICIO AÚN NO HA TERMINADO | FROM Serie Teorías | Temporada 4',
    summary: 'Plantea que la esperanza escapó al árbol, que el ritual sigue abierto y que algunos habitantes podrían ser los niños reencarnados.',
    dossiers: ['unfinished-sacrifice', 'life-energy-cycle', 'ritual-weapons'],
    searchTitle: 'EL SACRIFICIO AÚN NO HA TERMINADO FROM Serie Teorías Temporada 4'
  },
  {
    id: 'src-jade-villain', order: 6, phase: 'ARCHIVO BASE', code: 'TEORÍA', kind: 'theory',
    title: 'Jade es el verdadero villano | La teoría que cambia TODO | FROM Serie Teoría',
    summary: 'Reinterpreta a Jade y Christopher mediante Jasper, Toby, Francia y el sacrificio, aunque termina presentándose como un ejercicio poco probable.',
    dossiers: ['jade-villain', 'unfinished-sacrifice'],
    searchTitle: 'Jade es el verdadero villano La teoría que cambia TODO FROM Serie Teoría'
  },
  {
    id: 'src-e2', order: 7, phase: 'TEMPORADA 4', code: 'EPISODIO 2', kind: 'episode',
    title: 'Las pruebas estaban delante nuestra | Ep 2: análisis, explicación y teorías | FROM Serie T4',
    summary: 'Actualiza el archivo con la muerte de Jim, el simbolismo del colgado, la cronología de Jade, el valor de los objetos y nuevas pistas sobre el Lago de las Lágrimas.',
    dossiers: ['objects-memory', 'jade-villain', 'unfinished-sacrifice', 'jade-caves'],
    videoId: 'hRUTnIaeBy4'
  },
  {
    id: 'src-e4', order: 8, phase: 'TEMPORADA 4', code: 'EPISODIO 4', kind: 'episode',
    title: 'EL PASADO MÁS CRUEL | Ep 4: análisis, explicación y teorías | FROM Serie T4',
    summary: 'Profundiza en las formas del Hombre de Amarillo, los recuerdos, las posibles reencarnaciones y la absorción de energía vital.',
    dossiers: ['shapeshifter', 'objects-memory', 'life-energy-cycle', 'white-boy-tree'],
    videoId: 'CyiX-ojPC0w'
  },
  {
    id: 'src-jade-plan', order: 9, phase: 'TEMPORADA 4', code: 'TEORÍA INTERMEDIA', kind: 'theory',
    title: '¿El Plan de Jade es la SALIDA? | Teoría FROM Serie Temporada 4',
    summary: 'Reúne las pistas que apuntan hacia las cuevas y el lago, pero mantiene abierta la posibilidad de que la visión de Jade sea una manipulación.',
    dossiers: ['jade-caves', 'white-boy-tree', 'living-nightmares'],
    searchTitle: 'El Plan de Jade es la SALIDA Teoría FROM Serie Temporada 4'
  },
  {
    id: 'src-e6', order: 10, phase: 'TEMPORADA 4', code: 'EPISODIO 6', kind: 'episode',
    title: '¿Qué fue lo que pasó? | Ep 6: análisis, explicación y teorías | FROM Serie T4',
    summary: 'Pone a prueba el plan de las cuevas, recupera dibujos del lago y estudia si los tótems pueden convertirse en armas contra los monstruos.',
    dossiers: ['jade-caves', 'ritual-weapons', 'shapeshifter'],
    videoId: 'LM8kTKAOMbA'
  },
  {
    id: 'src-e7', order: 11, phase: 'TEMPORADA 4', code: 'EPISODIO 7', kind: 'episode',
    title: 'Una GRAN REVELACIÓN | Ep 7: análisis, explicación y teorías | FROM Serie T4',
    summary: 'La revelación pública de las reencarnaciones da paso a la teoría del intercambio de vidas, la energía que sostiene a los monstruos y el fracaso inicial de los tótems.',
    dossiers: ['life-energy-cycle', 'unfinished-sacrifice', 'ritual-weapons', 'jade-caves'],
    videoId: '7Mup_iY22jA'
  },
  {
    id: 'src-e9', order: 12, phase: 'TEMPORADA 4', code: 'EPISODIO 9', kind: 'episode',
    title: 'El inicio del FIN | Ep 9: análisis, explicación y teorías | FROM Serie T4',
    summary: 'Acelera el descenso a las cuevas, el arranque del árbol, la protección de la sala y la idea de que la entidad adopta apariencias diferentes para manipular.',
    dossiers: ['jade-caves', 'ritual-weapons', 'shapeshifter', 'jade-villain'],
    videoId: 'y_B9GSUE-qY'
  },
  {
    id: 'src-trailer-e10', order: 13, phase: 'TEMPORADA 4', code: 'TRÁILER EPISODIO 10', kind: 'trailer',
    title: '¿El Final del Ciclo? Análisis y teorías del tráiler del Episodio 10 | FROM Serie T4',
    summary: 'Anticipa el posible fracaso del plan, catástrofes, sacrificios, pérdida de protección y un nuevo reinicio del ciclo.',
    dossiers: ['jade-caves', 'ritual-weapons', 'fromville-pocket', 'life-energy-cycle'],
    videoId: 'GrEb6aYwKCs'
  },
  {
    id: 'src-t5', order: 14, phase: 'TEMPORADA 5', code: 'ACTUALIDAD', kind: 'news',
    title: 'TODO LO QUE SABEMOS TEMPORADA 5 | FROM Serie T5',
    summary: 'Traslada el archivo al futuro de la serie: Endgame, la primera noche sin talismanes, el regreso de Elgin y nuevas posibilidades para las formas de la entidad.',
    dossiers: ['shapeshifter', 'ritual-weapons', 'jade-caves'],
    videoId: '63yacyj-o-A'
  }
];

export function getDossierById(id: string): DossierData | undefined {
  return DOSSIERS.find((d) => d.id === id);
}

export function getSourceById(id: string): SourceData | undefined {
  return SOURCES.find((s) => s.id === id);
}

export function getDossiersByCategory(cat: string): DossierData[] {
  return DOSSIERS.filter((d) => d.category === cat);
}

export function getSourcesForDossier(dossierId: string): SourceData[] {
  return SOURCES.filter((s) => s.dossiers.includes(dossierId));
}
