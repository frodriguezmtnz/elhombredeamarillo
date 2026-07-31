import type { MysteryData } from '@lib/types';

export const MYSTERIES: MysteryData[] = [
  {
    id: 'm-sleepwalking',
    code: 'M-001',
    title: '¿POR QUÉ TABITHA DORMÍA CAMINANDO?',
    shortTitle: 'Sonambulismo de Tabitha',
    category: 'mechanic',
    context:
      'Tabitha caminaba dormida hacia el árbol de lejanía siendo niña. Este comportamiento se repitió en Fromville y parece conectado con su rol en el ciclo del sacrificio.',
    contributors: '3 creadores',
    mentions: 12,
    hypotheses: [
      {
        id: 'h1',
        title: 'El árbol la llamaba',
        description:
          'El Faraway Tree tenía un vínculo activo con Tabitha y la atraía físicamente durante el sueño para guiarla hacia el portal.',
        author: 'Canal',
        votes: 45,
      },
      {
        id: 'h2',
        title: 'Reencarnación activada',
        description:
          'El sonambulismo era el mecanismo por el que la Tabitha original recordaba parcialmente su papel anterior en el sacrificio.',
        author: 'Comunidad',
        votes: 32,
      },
      {
        id: 'h3',
        title: 'Protección inconsciente',
        description:
          'Su mente intentaba protegerla recordándole que debía volver al árbol para completar la misión que dejó pendiente.',
        author: 'Comunidad',
        votes: 18,
      },
    ],
  },
  {
    id: 'm-angkhooey',
    code: 'M-002',
    title: '¿QUIÉNES SON LOS NIÑOS DE "ANGK HOOEY"?',
    shortTitle: 'Los niños de Anghkooey',
    category: 'entity',
    context:
      'Los niños parecen ser las víctimas del sacrificio original. Su nombre "Anghkooey" aparece repetido y parece ser una palabra clave del ritual.',
    contributors: '5 creadores',
    mentions: 28,
    hypotheses: [
      {
        id: 'h4',
        title: 'Niños sacrificados',
        description:
          'Son los espíritus de los niños que fueron sacrificados en el ritual original y quedaron atrapados en Fromville.',
        author: 'Canal',
        votes: 67,
      },
      {
        id: 'h5',
        title: 'Niños reencarnados',
        description:
          'Algunos personajes actuales podrían ser reencarnaciones de estos niños, traídos de vuelta para completar el ciclo.',
        author: 'Comunidad',
        votes: 41,
      },
      {
        id: 'h6',
        title: 'Guardianes del árbol',
        description:
          'Los niños no son víctimas sino guardianes que protegen el árbol de lejanía y guían a los elegidos.',
        author: 'Comunidad',
        votes: 15,
      },
    ],
  },
  {
    id: 'm-yellow-man',
    code: 'M-003',
    title: '¿QUIÉN ES EL HOMBRE DE AMARILLO?',
    shortTitle: 'Identidad del Hombre de Amarillo',
    category: 'entity',
    context:
      'La entidad principal que adopta formas humanas y manipula a los habitantes. Su verdadera naturaleza sigue siendo el misterio central de la serie.',
    contributors: '6 creadores',
    mentions: 35,
    hypotheses: [
      {
        id: 'h7',
        title: 'Dios local de Fromville',
        description:
          'Es la entidad creadora del lugar, un ser que existe desde antes del sacrificio y que alimenta el ciclo.',
        author: 'Canal',
        votes: 89,
      },
      {
        id: 'h8',
        title: 'Primer habitante',
        description: 'Fue el primer ser humano atrapado en Fromville que acumuló poder suficiente para transformarse.',
        author: 'Comunidad',
        votes: 54,
      },
      {
        id: 'h9',
        title: 'Manifestación colectiva',
        description:
          'No es un ser individual sino la materialización del miedo colectivo de todos los habitantes atrapados.',
        author: 'Comunidad',
        votes: 23,
      },
    ],
  },
  {
    id: 'm-faraway-tree',
    code: 'M-004',
    title: '¿CÓMO FUNCIONA EL FARAWAY TREE?',
    shortTitle: 'Mecánica del árbol de lejanía',
    category: 'origin',
    context:
      'El árbol transporta personas a lugares aleatorios de Fromville. Su comportamiento parece tener reglas internas que aún no se comprenden completamente.',
    contributors: '4 creadores',
    mentions: 18,
    hypotheses: [
      {
        id: 'h10',
        title: 'Portal bidireccional',
        description:
          'El árbol no solo transporta sino que también puede traer cosas de fuera, explicando las llegadas de nuevos habitantes.',
        author: 'Canal',
        votes: 38,
      },
      {
        id: 'h11',
        title: 'Red de ubicaciones',
        description: 'Existe un mapa oculto de puntos de llegada que el árbol sigue según reglas que desconocemos.',
        author: 'Comunidad',
        votes: 27,
      },
      {
        id: 'h12',
        title: '选择性 transporte',
        description:
          'El árbol elige a quién transportar y hacia dónde, basándose en el rol de la persona en el ciclo del sacrificio.',
        author: 'Comunidad',
        votes: 19,
      },
    ],
  },
  {
    id: 'm-monsters-night',
    code: 'M-005',
    title: '¿POR QUÉ LOS MONSTRUOS SOLO SALEN DE NOCHE?',
    shortTitle: 'Regla nocturna de los monstruos',
    category: 'mechanic',
    context:
      'Los monstruos respetan una regla estricta: solo pueden atacar durante la noche. Los talismanes protegen las casas, pero la razón de esta limitación es un misterio.',
    contributors: '3 creadores',
    mentions: 15,
    hypotheses: [
      {
        id: 'h13',
        title: 'Debilidad solar',
        description: 'La luz del sol los debilita físicamente, como una versión extrema de los vampiros clásicos.',
        author: 'Comunidad',
        votes: 42,
      },
      {
        id: 'h14',
        title: 'Regla del ritual',
        description: 'Fue una de las condiciones impuestas por el sacrificio original: no pueden matar de día.',
        author: 'Canal',
        votes: 56,
      },
      {
        id: 'h15',
        title: 'Ciclo de alimentación',
        description:
          'Solo necesitan alimentarse durante la noche porque la energía vital es más "pura" en la oscuridad.',
        author: 'Comunidad',
        votes: 14,
      },
    ],
  },
  {
    id: 'm-talismans',
    code: 'M-006',
    title: '¿DE DÓNDE SALIERON LOS TALISMANES?',
    shortTitle: 'Origen de los talismanes',
    category: 'origin',
    context:
      'Boyd encontró los talismanes en un cave. Su origen y por qué funcionan como protección contra los monstruos sigue sin explicarse del todo.',
    contributors: '4 creadores',
    mentions: 20,
    hypotheses: [
      {
        id: 'h16',
        title: 'Restos del ritual',
        description:
          'Son fragmentos de las piedras utilizadas en el sacrificio original que absorbieron energía protectora.',
        author: 'Canal',
        votes: 51,
      },
      {
        id: 'h17',
        title: 'Creación de Boyd',
        description: 'Boyd los creó inconscientemente usando su fe, como los monstruos fueron creados por el miedo.',
        author: 'Comunidad',
        votes: 29,
      },
      {
        id: 'h18',
        title: 'Herramienta de la entidad',
        description: 'Los talismanes no protegen sino que dirigen a los monstruos, controlando dónde y cuándo atacan.',
        author: 'Comunidad',
        votes: 21,
      },
    ],
  },
];

export function getMysteryById(id: string): MysteryData | undefined {
  return MYSTERIES.find((m) => m.id === id);
}

export function getMysteriesByCategory(cat: string): MysteryData[] {
  return MYSTERIES.filter((m) => m.category === cat);
}

export function getTotalHypotheses(): number {
  return MYSTERIES.reduce((sum, m) => sum + m.hypotheses.length, 0);
}

export function getTotalVotes(): number {
  return MYSTERIES.reduce((sum, m) => sum + m.hypotheses.reduce((s, h) => s + h.votes, 0), 0);
}
