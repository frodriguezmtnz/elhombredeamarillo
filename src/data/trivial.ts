import type { TriviaCategory, TriviaQuestion } from '@lib/types';

/**
 * Banco de preguntas del Trivial del Pueblo.
 *
 * convención:
 * - `answer` es el índice de la opción correcta SOBRE EL ARRAY TAL CUAL ESTÁ
 *   escrito aquí; el mazo se baraja en cliente (opciones incluidas).
 * - `season: 0` = la pregunta no revela trama (reglas generales, producción, canal).
 * - `season: N` = requiere haber visto hasta la temporada N (spoilers).
 * - Revisar/actualizar `temporadas` y `produccion` cuando estrene la T4.
 */

export const TRIVIA_CATEGORY_LABELS: Record<TriviaCategory, string> = {
  reglas: 'REGLAS DEL PUEBLO',
  criaturas: 'CRIATURAS Y ENTIDADES',
  personajes: 'PERSONAJES',
  temporadas: 'TRAMA POR TEMPORADAS',
  produccion: 'PRODUCCIÓN',
  canal: 'EL CANAL',
};

export interface TriviaRank {
  key: string;
  name: string;
  /** % mínimo de aciertos para obtener el rango */
  minAccuracy: number;
  description: string;
}

export const TRIVIA_RANKS: TriviaRank[] = [
  {
    key: 'cautivo',
    name: 'CAUTIVO',
    minAccuracy: 0,
    description: 'Llevas poco en el pueblo y todavía no te has leído las reglas. Quédate dentro y observa.',
  },
  {
    key: 'llegado',
    name: 'LLEGADO',
    minAccuracy: 40,
    description: 'Ya sabes dónde estás… y dónde no debes estar cuando cae el sol.',
  },
  {
    key: 'vigia',
    name: 'VIGÍA',
    minAccuracy: 60,
    description: 'Conoces el talismán, el cuerno y las voces del bosque. Empiezas a escuchar de verdad.',
  },
  {
    key: 'sheriff',
    name: 'SHERIFF',
    minAccuracy: 80,
    description: 'Podrías repartir talismanes y dar el discurso de las buenas noches.',
  },
  {
    key: 'hombre-amarillo',
    name: 'EL HOMBRE DE AMARILLO',
    minAccuracy: 95,
    description: 'Sabes demasiado. Da la sensación de que el pueblo te ha dejado marchar… por algo.',
  },
];

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // ── REGLAS DEL PUEBLO ────────────────────────────────────────────────
  {
    id: 'r1',
    category: 'reglas',
    difficulty: 1,
    season: 0,
    question: 'Al caer el sol suena un misterioso sonido que recorre el pueblo. ¿Cuál?',
    options: ['Una campana', 'Un cuerno', 'Un tambor', 'Un silbato'],
    answer: 1,
    explanation: 'El cuerno del anochecer es la señal: la noche ha comenzado y nadie debe estar fuera.',
  },
  {
    id: 'r2',
    category: 'reglas',
    difficulty: 1,
    season: 0,
    question: '¿Qué objeto es indispensable para sobrevivir a la noche fuera de casa?',
    options: ['Una linterna', 'Un talismán', 'Un arma de fuego', 'Un mapa del pueblo'],
    answer: 1,
    explanation: 'El pequeño talismán protege a quien lo lleva de las criaturas mientras dura la noche.',
  },
  {
    id: 'r3',
    category: 'reglas',
    difficulty: 1,
    season: 0,
    question: 'Cuando cae la noche, la regla de oro es…',
    options: ['Reunirse en la plaza', 'Encender hogueras', 'Estar dentro de tu casa', 'Subir al bosque'],
    answer: 2,
    explanation: 'El interior de la propia casa protege a sus habitantes; la calle es territorio de las criaturas.',
  },
  {
    id: 'r4',
    category: 'reglas',
    difficulty: 1,
    season: 0,
    question: '¿Qué ocurre cuando intentas alejar del pueblo por la autopista?',
    options: [
      'Se acaba la gasolina',
      'Un animal corta la carretera',
      'La radio pierde señal',
      'La carretera te devuelve al pueblo',
    ],
    answer: 3,
    explanation: 'La autopista es un bucle: por mucho que conduzcas, siempre terminas de vuelta en el pueblo.',
  },
  {
    id: 'r5',
    category: 'reglas',
    difficulty: 2,
    season: 0,
    question: '¿Qué truco usan las criaturas por la noche para tentar a sus víctimas?',
    options: ['Imitan voces de seres queridos', 'Apagan las farolas', 'Copian el cuerno', 'Excavan bajo las puertas'],
    answer: 0,
    explanation: 'Llaman a la puerta o desde el bosque con voces de personas cercanas. Responder puede ser mortal.',
  },
  {
    id: 'r6',
    category: 'reglas',
    difficulty: 2,
    season: 0,
    question: '¿Qué anomalía eléctrica caracteriza al pueblo?',
    options: [
      'Funciona con generadores ocultos',
      'La luz y los aparatos funcionan sin fuente conocida',
      'Solo hay electricidad de día',
      'Las pilas se agotan al anochecer',
    ],
    answer: 1,
    explanation:
      'No hay red eléctrica conocida ni central, pero las luces y algunos aparatos funcionan. Es uno de los misterios recurrentes.',
  },
  {
    id: 'r7',
    category: 'reglas',
    difficulty: 2,
    season: 0,
    question: '¿Cómo se comportan los teléfonos móviles en el pueblo?',
    options: [
      'No tienen ninguna señal',
      'Funcionan dentro del pueblo pero no conectan con el exterior',
      'Solo funcionan en la iglesia',
      'Solo funcionan de noche',
    ],
    answer: 1,
    explanation:
      'Los residentes pueden llamar y recibir mensajes dentro del pueblo, pero comunicarse con el mundo exterior es imposible.',
  },
  {
    id: 'r8',
    category: 'reglas',
    difficulty: 1,
    season: 0,
    question: '¿Cuándo termina la amenaza nocturna?',
    options: [
      'A las tres de la madrugada',
      'Cuando suena de nuevo el cuerno',
      'Con la salida del sol',
      'Cuando termina la luna llena',
    ],
    answer: 2,
    explanation: 'Con el alba las criaturas desaparecen y el pueblo puede respirar… hasta el siguiente anochecer.',
  },
  {
    id: 'r9',
    category: 'reglas',
    difficulty: 3,
    season: 0,
    question: '¿Qué apodo han dado los fans al pueblo donde está atrapada la gente?',
    options: ['Marrow Falls', 'FROMville', 'Crimson Town', 'Hollow Creek'],
    answer: 1,
    explanation: 'En la serie casi siempre es «el pueblo»; la comunidad de fans lo bautizó como Fromville.',
  },
  {
    id: 'r10',
    category: 'reglas',
    difficulty: 3,
    season: 0,
    question: '¿Qué ocurre con las casas cuando llegan familias nuevas?',
    options: [
      'Deben construirlas ellos mismos',
      'Las elige el sheriff',
      'Se ocupan al azar cada noche',
      'Ya parecen preparadas para recibirlas, con llaves esperándoles',
    ],
    answer: 3,
    explanation:
      'Detalle inquietante del piloto: las casas tienen llaves y están listas antes de que nadie las reclame. Como si el pueblo las preparara.',
  },
  {
    id: 'r11',
    category: 'reglas',
    difficulty: 2,
    season: 0,
    question: '¿Qué pasa si te quedas dormido fuera de casa una noche?',
    options: [
      'Despiertas en el autobús de entrada',
      'El pueblo te devuelve a la cama',
      'Es prácticamente una sentencia de muerte',
      'Nada, las criaturas solo atacan en el bosque',
    ],
    answer: 2,
    explanation:
      'Dormir fuera de la protección de una casa propia, o quedarse sin talismán a la intemperie, suele terminar en muerte o desaparición.',
  },
  {
    id: 'r12',
    category: 'reglas',
    difficulty: 3,
    season: 0,
    question: '¿Qué papel juega el bosque de noche?',
    options: [
      'Zona de caza: atrae y pierde a quien entra',
      'Refugio más seguro que las casas',
      'Ruta de escape hacia la autopista',
      'Lugar donde la señal de radio vuelve',
    ],
    answer: 0,
    explanation: 'El bosque es el dominio nocturno por excelencia: atrae, desorienta y se queda con quien se adentra.',
  },

  // ── CRIATURAS Y ENTIDADES ────────────────────────────────────────────
  {
    id: 'c1',
    category: 'criaturas',
    difficulty: 1,
    season: 0,
    question: '¿Cómo se llama la entidad con vestido amarillo que atrae a la gente al bosque?',
    options: ['La Mujer de Amarillo', 'La Dama Blanca', 'La Madre del Bosque', 'La Vecina'],
    answer: 0,
    explanation: 'La Mujer de Amarillo es una de las entidades más antiguas y inquietantes del pueblo.',
  },
  {
    id: 'c2',
    category: 'criaturas',
    difficulty: 2,
    season: 0,
    question: '¿Qué rasgo facial hace especialmente perturbadora a la Mujer de Amarillo?',
    options: ['No tiene ojos', 'Su sonrisa demasiado amplia', 'Su boca negra', 'Tiene dos narices'],
    answer: 1,
    explanation: 'Esa sonrisa «de más», imposible en un rostro humano, es su firma visual.',
  },
  {
    id: 'c3',
    category: 'criaturas',
    difficulty: 1,
    season: 0,
    question: '¿Cómo son las criaturas que acechan las noches?',
    options: [
      'Máquinas oxidadas',
      'Figuras envueltas en llamas',
      'Humanoides pálidos y delgados',
      'Enormes animales negros',
    ],
    answer: 2,
    explanation: 'Aparecen como humanoides desaliñados y cadavéricos, con comportamientos casi animales.',
  },
  {
    id: 'c4',
    category: 'criaturas',
    difficulty: 2,
    season: 0,
    question: 'Al moverse, las criaturas suelen…',
    options: [
      'Flotar en silencio',
      'Desplazarse a cuatro patas y correr en zigzag',
      'Avanzar siempre en fila',
      'Quedarse inmóviles hasta el alba',
    ],
    answer: 1,
    explanation: 'Se mueven con agilidad antinatural, gateando o corriendo en zigzag, y son rapidísimas.',
  },
  {
    id: 'c5',
    category: 'criaturas',
    difficulty: 2,
    season: 1,
    question: 'En la primera temporada aparece una plaga parasitaria que altera a las personas. ¿De qué se trata?',
    options: ['Avispas bajo la piel', 'Gusanos', 'Moho negro', 'Sanguijuelas del arroyo'],
    answer: 1,
    explanation:
      'Los gusanos del suelo infectan a personas y animales y se asocian con cambios de comportamiento inquietantes.',
  },
  {
    id: 'c6',
    category: 'criaturas',
    difficulty: 2,
    season: 3,
    question: 'En la tercera temporada, ¿qué contrapartida masculina de la Mujer de Amarillo toma protagonismo?',
    options: ['El Hombre de Amarillo', 'El Coleccionista', 'El Pastor', 'El Cochero'],
    answer: 0,
    explanation: 'El Hombre de Amarillo emerge como entidad clave de la temporada y conecta con el título del canal.',
  },
  {
    id: 'c7',
    category: 'criaturas',
    difficulty: 2,
    season: 1,
    question: '¿Qué les ocurre a menudo a las víctimas ligadas a la Mujer de Amarillo?',
    options: [
      'Amanecen petrificadas',
      'Aparecen calcinadas',
      'Se las encuentra con una amplia sonrisa macabra',
      'Desaparecen sin dejar rastro siempre',
    ],
    answer: 2,
    explanation: 'La sonrisa congelada en el rostro de las víctimas es una de sus marcas más terroríficas.',
  },
  {
    id: 'c8',
    category: 'criaturas',
    difficulty: 3,
    season: 1,
    question: '¿Qué ocurre con las criaturas cuando da el sol?',
    options: [
      'Se ocultan bajo el pueblo',
      'Desaparecen',
      'Se vuelven inofensivas pero siguen ahí',
      'Quedan atrapadas en el bosque',
    ],
    answer: 1,
    explanation:
      'De día no están: la amenaza es estrictamente nocturna, lo que refuerza el ritmo día/noche del pueblo.',
  },
  {
    id: 'c9',
    category: 'criaturas',
    difficulty: 2,
    season: 2,
    question: '¿Qué consigue la Mujer de Amarillo con quienes la siguen al bosque?',
    options: [
      'Se pierden y reaparecen días después',
      'Nunca vuelven a aparecer',
      'Quedan dormidas todo el día siguiente',
      'Se convierten en criaturas',
    ],
    answer: 1,
    explanation: 'Quien la sigue normalmente desaparece para siempre; solo quedan su sonrisa y el recuerdo.',
  },
  {
    id: 'c10',
    category: 'criaturas',
    difficulty: 3,
    season: 2,
    question: 'Además de atacar, ¿qué función inquietante se ha visto cumplir a las criaturas?',
    options: [
      'Labrar la tierra de noche',
      'Reparar objetos rotos',
      'Observar y estudiar a los residentes',
      'Encender las farolas',
    ],
    answer: 2,
    explanation: 'En varias escenas no atacan: miran, rodean y parecen recopilar información sobre los habitantes.',
  },

  // ── PERSONAJES ───────────────────────────────────────────────────────
  {
    id: 'p1',
    category: 'personajes',
    difficulty: 1,
    season: 0,
    question: '¿Qué actor interpreta a Jim Matthews?',
    options: ['Harold Perrineau', 'David Alpay', 'Eoin Macken', 'Simon North'],
    answer: 0,
    explanation: 'Harold Perrineau (Lost, Oz) da vida a Jim Matthews, patriarca de la familia.',
  },
  {
    id: 'p2',
    category: 'personajes',
    difficulty: 1,
    season: 0,
    question: '¿Quién interpreta a Tabitha Matthews?',
    options: ['Emma Bell', 'Catalina Sandino Moreno', 'Vanessa Morgan', 'Courtney B. Vance'],
    answer: 1,
    explanation: 'Catalina Sandino Moreno, ganadora de un Oscar por María, llena eres de gracia, es Tabitha.',
  },
  {
    id: 'p3',
    category: 'personajes',
    difficulty: 1,
    season: 0,
    question: '¿Quién es el sheriff del pueblo al que llegan los Matthews?',
    options: ['Victor', 'Kenny', 'Boyd Stevens', 'Ellis'],
    answer: 2,
    explanation: 'Boyd Stevens (Eoin Macken) es el sheriff: conoce las reglas y protege a la comunidad como puede.',
  },
  {
    id: 'p4',
    category: 'personajes',
    difficulty: 1,
    season: 0,
    question: '¿Cómo se llaman los hijos de Jim y Tabitha?',
    options: ['Julie y Ethan', 'Ellis y Wendy', 'Clark y Jade', 'Ricky y Sara'],
    answer: 0,
    explanation: 'Julie (adolescente) y Ethan (el pequeño) completan a la familia Matthews.',
  },
  {
    id: 'p5',
    category: 'personajes',
    difficulty: 2,
    season: 0,
    question: '¿Qué afición artística define a Tabitha Matthews?',
    options: ['La fotografía', 'La escultura', 'La pintura', 'El collage'],
    answer: 2,
    explanation: 'Tabitha pinta, y sus cuadros y pinceles se convierten en un símbolo recurrente de la familia.',
  },
  {
    id: 'p6',
    category: 'personajes',
    difficulty: 2,
    season: 1,
    question: '¿Dónde trabaja Victor, uno de los residentes clave?',
    options: ['En la gasolinera', 'En la cafetería', 'En la iglesia', 'En la consulta médica'],
    answer: 0,
    explanation: 'Victor (David Alpay) atiende la gasolinera del pueblo.',
  },
  {
    id: 'p7',
    category: 'personajes',
    difficulty: 2,
    season: 1,
    question: '¿Quién es Jade?',
    options: [
      'La doctora del pueblo',
      'Una residente joven que parece saber más del pueblo que nadie',
      'La profesora de Julie',
      'La esposa de Boyd',
    ],
    answer: 1,
    explanation: 'Jade (Chelsea Hobbs) es una de las llaves vivas de los secretos del pueblo.',
  },
  {
    id: 'p8',
    category: 'personajes',
    difficulty: 3,
    season: 2,
    question: '¿Qué rol de responsabilidad asume Jim Matthews con el tiempo?',
    options: ['Alcalde', 'Sheriff', 'Pastor', 'Médico del pueblo'],
    answer: 1,
    explanation: 'Jim acaba cargando la autoridad de la ley en un pueblo donde la ley es, literalmente, sobrevivir.',
  },
  {
    id: 'p9',
    category: 'personajes',
    difficulty: 3,
    season: 1,
    question: '¿Cómo se llama el joven del pueblo que se acerca a Julie?',
    options: ['Ellis', 'Kenny', 'Jeffrey', 'Adam'],
    answer: 0,
    explanation:
      'Ellis es el chico del pueblo que conecta con Julie en su intento de hacer vida normal entre tanto horror.',
  },
  {
    id: 'p10',
    category: 'personajes',
    difficulty: 3,
    season: 0,
    question: '¿Qué actor interpreta a Victor?',
    options: ['Eoin Macken', 'David Alpay', 'Simon North', 'Harold Perrineau'],
    answer: 1,
    explanation: 'David Alpay (Colinas con ojos) es Victor.',
  },
  {
    id: 'p11',
    category: 'personajes',
    difficulty: 3,
    season: 1,
    question: '¿Quién es Boyd Stevens para el pueblo?',
    options: ['Su sheriff', 'Su médico', 'Su profesor', 'Su mensajero'],
    answer: 0,
    explanation: 'Boyd encarna la ley y la organización comunitaria desde el primer día.',
  },
  {
    id: 'p12',
    category: 'personajes',
    difficulty: 2,
    season: 0,
    question: '¿Qué familia es la que abre la serie al quedarse atrapada?',
    options: ['Los Stevens', 'Los Matthews', 'Los Genero', 'Los Lism'],
    answer: 1,
    explanation: 'El piloto sigue a la familia Matthews, nuestros ojos para descubrir las reglas.',
  },

  // ── TRAMA POR TEMPORADAS (spoilers) ──────────────────────────────────
  {
    id: 't1',
    category: 'temporadas',
    difficulty: 1,
    season: 1,
    question:
      'Al entrar en el pueblo, los Matthews encuentran un vehículo detenido con todos sus ocupantes muertos. ¿Cuál?',
    options: ['Un autobús', 'Un tren de cercanías', 'Un camión de mudanza', 'Un autocar de excursión escolar'],
    answer: 0,
    explanation: 'El autobús de pasajeros silenciosos es la primera imagen de horror de la serie.',
  },
  {
    id: 't2',
    category: 'temporadas',
    difficulty: 2,
    season: 1,
    question: '¿Por qué se detiene la familia Matthews a la entrada del pueblo?',
    options: ['Una multa de tráfico', 'Una tormenta los desvía', 'Su coche se avería', 'Recogen a un autostopista'],
    answer: 2,
    explanation: 'El coche deja de funcionar sin explicación clara en la entrada: el pueblo acaba de «invitarlos».',
  },
  {
    id: 't3',
    category: 'temporadas',
    difficulty: 2,
    season: 1,
    question: '¿Qué título recibe el primer episodio de la serie?',
    options: ['«La parada»', '«Pilot»', '«Earworm»', '«El cuerno»'],
    answer: 1,
    explanation: 'Sin florituras: el primer capítulo se llama, sencillamente, «Pilot».',
  },
  {
    id: 't4',
    category: 'temporadas',
    difficulty: 2,
    season: 2,
    question: '¿Qué se esconde tras un socavón en la cantera del pueblo?',
    options: ['Un aparcamiento subterráneo', 'Una red de cuevas y túneles', 'Un avión estrellado', 'Un antiguo fuerte'],
    answer: 1,
    explanation: 'Las cuevas bajo el pueblo revelan una red subterránea con un pasado muy oscuro.',
  },
  {
    id: 't5',
    category: 'temporadas',
    difficulty: 3,
    season: 2,
    question: '¿Con qué descubrimiento relacionado con Jade conectan sus flashbacks?',
    options: [
      'Nació en la ciudad vecina',
      'Tuvo una vida previa marcada por el pueblo y las cuevas',
      'Es una criatura',
      'Fue policía en otro estado',
    ],
    answer: 1,
    explanation: 'El pasado de Jade se enlaza con la historia oculta del pueblo, mucho más antigua de lo que aparenta.',
  },
  {
    id: 't6',
    category: 'temporadas',
    difficulty: 2,
    season: 3,
    question: '¿Qué fenómeno misterioso toma protagonismo en la tercera temporada?',
    options: [
      'Unas casas que parecen estar vivas',
      'Un lago que aparece de la noche a la mañana',
      'Un tren que recorre el pueblo',
      'Un faro',
    ],
    answer: 0,
    explanation:
      'La T3 lleva la idea de que el pueblo está vivo hasta sus últimas consecuencias: hay casas que se comportan como organismos.',
  },
  {
    id: 't7',
    category: 'temporadas',
    difficulty: 3,
    season: 2,
    question: '¿Qué muestran los flashbacks que viajan a otras épocas?',
    options: [
      'El pueblo solo existió en los años 70',
      'Grupos de personas atrapadas en distintos períodos',
      'El futuro del pueblo',
      'Que las criaturas eran humanas',
    ],
    answer: 1,
    explanation:
      'El pueblo se ha repetido con «ciclos» distintos: siempre hubo alguien atrapado bajo las mismas reglas.',
  },
  {
    id: 't8',
    category: 'temporadas',
    difficulty: 2,
    season: 1,
    question: '¿Dónde se reúne habitualmente la comunidad durante el día?',
    options: ['En la cafetería', 'En la biblioteca', 'En el polideportivo', 'En la gasolinera'],
    answer: 0,
    explanation: 'El diner del pueblo funciona como salón comunitario a plena luz del sol.',
  },
  {
    id: 't9',
    category: 'temporadas',
    difficulty: 3,
    season: 1,
    question: '¿Qué ocurre en los primeros episodios con el terreno del pueblo?',
    options: [
      'Aparecen círculos en la hierba',
      'El suelo se llena de gusanos muertos',
      'Nace un bosque nuevo',
      'Brota agua negra',
    ],
    answer: 1,
    explanation:
      'El episodio inicial muestra el suelo cuajado de gusanos, presentimiento de lo que se esconde bajo el pueblo.',
  },
  {
    id: 't10',
    category: 'temporadas',
    difficulty: 3,
    season: 3,
    question: '¿Dónde entierra el pueblo a las víctimas de las criaturas?',
    options: ['En el fondo de la cantera', 'En el bosque', 'En el cementerio', 'No los entierran: arden'],
    answer: 2,
    explanation: 'El cementerio con sus lápidas es uno de los rincones más tristes (y visitados) del pueblo.',
  },
  {
    id: 't11',
    category: 'temporadas',
    difficulty: 2,
    season: 1,
    question: '¿Qué intenta hacer Boyd en la primera temporada?',
    options: [
      'Vender el pueblo',
      'Organizar la defensa y el abastecimiento del pueblo',
      'Escapar y dejar a los demás',
      'Derribar el bosque',
    ],
    answer: 1,
    explanation:
      'Boyd impone turnos de vigilancia, reglas y expediciones de suministros: el pueblo necesita estructura para sobrevivir.',
  },
  {
    id: 't12',
    category: 'temporadas',
    difficulty: 3,
    season: 2,
    question: '¿Qué construye la comunidad para no depender del exterior?',
    options: ['Un aeródromo', 'Una estación de radio', 'Sistemas propios de cultivo y ganado', 'Un ferrocarril'],
    answer: 2,
    explanation: 'Como no llegan suministros, el pueblo se organiza para producir su propia comida.',
  },

  // ── PRODUCCIÓN ───────────────────────────────────────────────────────
  {
    id: 'pr1',
    category: 'produccion',
    difficulty: 1,
    season: 0,
    question: '¿En qué cadena estadounidense se estrenó FROM?',
    options: ['HBO', 'Showtime', 'Netflix', 'AMC'],
    answer: 1,
    explanation: 'FROM es una producción de Showtime (hoy bajo el paraguas de Paramount).',
  },
  {
    id: 'pr2',
    category: 'produccion',
    difficulty: 1,
    season: 0,
    question: '¿En qué año se estrenó la serie?',
    options: ['2019', '2020', '2022', '2024'],
    answer: 2,
    explanation: 'El estreno fue en febrero de 2022.',
  },
  {
    id: 'pr3',
    category: 'produccion',
    difficulty: 2,
    season: 0,
    question: '¿Quién creó la serie?',
    options: ['John Worsley', 'Jack Bender', 'Michael J. Sigelow', 'J.J. Abrams'],
    answer: 0,
    explanation: 'John Worsley es el creador y showrunner; Michael J. Sigelow firmó el concepto original.',
  },
  {
    id: 'pr4',
    category: 'produccion',
    difficulty: 2,
    season: 0,
    question: 'Productor ejecutivo y director habitual (dirigió el piloto). ¿Quién?',
    options: ['David Lynch', 'J.J. Abrams', 'Jack Bender', 'Ryan Murphy'],
    answer: 2,
    explanation:
      'Jack Bender, productor y director clave de Lost y The Sopranos, produce y ha dirigido muchísimos episodios, incluido el piloto.',
  },
  {
    id: 'pr5',
    category: 'produccion',
    difficulty: 3,
    season: 0,
    question: 'De quién es el concepto original en el que se basa FROM, un profesor que escribió la idea de joven?',
    options: ['Michael J. Sigelow', 'John Worsley', 'Stephen King', 'Jeff Pinkner'],
    answer: 0,
    explanation: 'Michael J. Sigelow, profesor de matemáticas, escribió de joven «The Town», base del concepto.',
  },
  {
    id: 'pr6',
    category: 'produccion',
    difficulty: 2,
    season: 0,
    question: '¿Dónde se rueda la serie?',
    options: ['Vancouver', 'Ontario (Canadá)', 'Albuquerque', 'Dublín'],
    answer: 1,
    explanation: 'El rodaje se desarrolla en Ontario, Canadá.',
  },
  {
    id: 'pr7',
    category: 'produccion',
    difficulty: 2,
    season: 0,
    question: '¿En qué plataforma puede verse la serie en España?',
    options: ['Movistar+', 'SkyShowtime', 'ATRESplayer Premium', 'Filmin'],
    answer: 1,
    explanation: 'En España FROM está en SkyShowtime (el servicio de NBCUniversal/Paramount).',
  },
  {
    id: 'pr8',
    category: 'produccion',
    difficulty: 1,
    season: 0,
    question: '¿Con qué serie de supervivencia en un lugar imposible se la compara casi siempre?',
    options: ['Stranger Things', 'Perdidos (Lost)', 'The Walking Dead', 'Twin Peaks'],
    answer: 1,
    explanation: 'La comparación es clásica: además, Jack Bender es nexo común con Lost.',
  },
  {
    id: 'pr9',
    category: 'produccion',
    difficulty: 2,
    season: 0,
    question: '¿En qué año se estrenó la segunda temporada?',
    options: ['2022', '2023', '2024', '2025'],
    answer: 1,
    explanation: 'La T2 llegó en febrero de 2023.',
  },
  {
    id: 'pr10',
    category: 'produccion',
    difficulty: 2,
    season: 0,
    question: '¿En qué año se estrenó la tercera temporada?',
    options: ['2023', '2024', '2025', '2026'],
    answer: 2,
    explanation: 'La T3 se estrenó en 2025.',
  },
  {
    id: 'pr11',
    category: 'produccion',
    difficulty: 3,
    season: 0,
    question: '¿Cuántos episodios tiene cada una de las temporadas emitidas hasta ahora?',
    options: ['8', '10', '12', '13'],
    answer: 1,
    explanation: 'Las tres temporadas constan de 10 episodios cada una.',
  },

  // ── EL CANAL (meta) ──────────────────────────────────────────────────
  {
    id: 'ch1',
    category: 'canal',
    difficulty: 1,
    season: 0,
    question: '¿Cuál es el handle de YouTube de El Hombre de Amarillo?',
    options: ['@koiboy_OG', '@amarilloOG', '@theyellowman', '@koiboyTVE'],
    answer: 0,
    explanation: 'El canal se llama @koiboy_OG. Si no lo sabías… ¿has estado en otro pueblo?',
  },
  {
    id: 'ch2',
    category: 'canal',
    difficulty: 1,
    season: 0,
    question: '¿Qué sección de la web reúne las teorías como archivos de investigación?',
    options: ['Vídeos', 'Expedientes', 'Comunidad', 'El umbral'],
    answer: 1,
    explanation: 'Expedientes es el muro de teorías con pistas, dudas y cronología.',
  },
  {
    id: 'ch3',
    category: 'canal',
    difficulty: 2,
    season: 0,
    question: '¿Cómo se llama el juego 3D para el navegador que aloja la web?',
    options: ['Fromville', 'The Road', 'Crows', 'El Talismán'],
    answer: 1,
    explanation:
      'THE ROAD es el juego original de horror: conducir de noche por una carretera que no está en ningún mapa.',
  },
  {
    id: 'ch4',
    category: 'canal',
    difficulty: 2,
    season: 0,
    question: '¿En qué dos formatos se organiza la biblioteca de vídeos del canal?',
    options: ['Reacciones y directos', 'Análisis y debates', 'Teorías y resúmenes', 'Cortos y largos'],
    answer: 1,
    explanation: 'Análisis y debates: las dos formas de diseccionar cada episodio.',
  },
  {
    id: 'ch5',
    category: 'canal',
    difficulty: 3,
    season: 0,
    question: 'Según el archivo, ¿cuántas teorías base documenta la sección de Expedientes?',
    options: ['3', '4', '6', '8'],
    answer: 2,
    explanation: 'El archivo parte de 6 teorías base transcritas de los vídeos.',
  },
  {
    id: 'ch6',
    category: 'canal',
    difficulty: 1,
    season: 0,
    question: '¿Qué color vertebra la identidad de la web… y del hombre que le da nombre?',
    options: ['Rojo', 'Verde', 'Negro', 'Amarillo'],
    answer: 3,
    explanation: 'Amarillo, por supuesto. Como el traje que es mejor no seguir con la mirada.',
  },
];

// ── Utilidades de mazo ─────────────────────────────────────────────────

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface DeckConfig {
  count: number;
  categories?: TriviaCategory[];
  season?: 1 | 2 | 3;
  minDifficulty?: 1 | 2 | 3;
  /** Si es true, solo preguntas sin spoilers de trama (season === 0) */
  safeOnly?: boolean;
}

/**
 * Construye un mazo barajado y prepara las opciones desordenadas
 * (`options` y `answer` reindexados) para cada pregunta.
 */
export function buildDeck(config: DeckConfig): TriviaQuestion[] {
  let pool = TRIVIA_QUESTIONS;

  if (config.safeOnly) {
    pool = pool.filter((q) => q.season === 0);
  }
  if (config.categories && config.categories.length > 0) {
    pool = pool.filter((q) => config.categories?.includes(q.category));
  }
  if (config.season !== undefined) {
    pool = pool.filter((q) => q.season === config.season || q.season === 0);
  }
  if (config.minDifficulty !== undefined) {
    pool = pool.filter((q) => q.difficulty >= config.minDifficulty);
  }

  return shuffle(pool)
    .slice(0, config.count)
    .map((q) => {
      const correctOption = q.options[q.answer];
      const mixed = shuffle(q.options);
      return { ...q, options: mixed, answer: mixed.indexOf(correctOption) };
    });
}

export function getRank(accuracyPercent: number): TriviaRank {
  return [...TRIVIA_RANKS].reverse().find((r) => accuracyPercent >= r.minAccuracy) ?? TRIVIA_RANKS[0];
}
