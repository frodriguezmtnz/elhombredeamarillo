export interface CreatorData {
  name: string;
  handle: string;
  url: string;
  image: string;
  featured?: boolean;
}

export interface VideoReference {
  type: string;
  label: string;
  title: string;
  creator: string;
  handle: string;
  url: string;
  profileUrl: string;
  image: string;
  imageFallback?: string;
  imageAlt: string;
  action: string;
  description: string;
}

export interface VideoData {
  id: string;
  code: string;
  category: 'analysis' | 'debate';
  title: string;
  description: string;
  videoId: string;
  publishedAt?: string;
  order: number;
  label?: string;
  guests?: string[];
  references?: VideoReference[];
}

export interface ChannelData {
  name: string;
  handle: string;
  url: string;
  videosUrl: string;
  subscribersFallback: number;
  latestFallbackId: string;
  summary: string;
  instagram: string;
  email: string;
}

export interface Evidence {
  title: string;
  text: string;
}

export interface DossierData {
  id: string;
  number: string;
  category: 'origin' | 'entity' | 'exit' | 'ritual' | 'character' | 'mechanic';
  categoryLabel: string;
  status: string;
  statusTone: 'core' | 'open' | 'warning';
  title: string;
  shortTitle: string;
  summary: string;
  thesis: string;
  evidence: Evidence[];
  doubts: string[];
  tags: string[];
  sourceIds: string[];
  related: string[];
}

export interface SourceData {
  id: string;
  order: number;
  phase: string;
  code: string;
  kind: 'theory' | 'episode' | 'trailer' | 'news';
  title: string;
  summary: string;
  dossiers: string[];
  videoId?: string;
  searchTitle?: string;
}

export interface CasesMeta {
  title: string;
  baseTheories: number;
  transcribedVideos: number;
  note: string;
}

export interface HypothesisData {
  id: string;
  title: string;
  description: string;
  author: string;
  votes: number;
}

export interface MysteryData {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  category: 'entity' | 'origin' | 'character' | 'mechanic';
  context: string;
  contributors: string;
  mentions: number;
  hypotheses: HypothesisData[];
}

// ── Trivial ──

export type TriviaCategory =
  | 'reglas'
  | 'criaturas'
  | 'personajes'
  | 'temporadas'
  | 'misterios'
  | 'lugares'
  | 'musica'
  | 'produccion'
  | 'canal';

export type TriviaSpoilerLevel = 0 | 1 | 2 | 3 | 4;

export type TriviaReach = 'T1' | 'T2' | 'T3' | 'T4' | 'Global' | 'Pre-serie' | 'Producción' | 'Promoción';

export interface TriviaQuestion {
  id: string;
  category: TriviaCategory;
  /** 1 = fácil, 2 = media, 3 = difícil (afecta a la puntuación) */
  difficulty: 1 | 2 | 3;
  /**
   * Nivel de spoiler: 0 = no revela trama (reglas, producción, reparto accesible
   * en prensa); N (1-4) = requiere haber visto hasta la temporada N.
   */
  spoilersUpTo: TriviaSpoilerLevel;
  /** Alcance temático de la pregunta (para la píldora en pantalla); opcional */
  reach?: TriviaReach;
  /** Palabras clave de búsqueda/orden (opcional; no se muestran en juego) */
  tags?: string[];
  question: string;
  options: string[];
  /** Índice de la opción correcta sobre `options` (se baraja en cliente) */
  answer: number;
  explanation: string;
}

export interface TriviaAnswerRecord {
  questionId: string;
  correct: boolean;
  timedOut: boolean;
  /** Segundos restantes en el momento de responder */
  timeLeft: number;
  /** Puntos obtenidos por esta pregunta */
  points: number;
}

export interface TriviaBestScore {
  score: number;
  correct: number;
  total: number;
  modeLabel: string;
  rank: string;
  date: string;
}

/** Datos de una partida terminada listos para enviar al tablón */
export interface TriviaScorePayload {
  userId: string | null;
  player: string;
  mode: string;
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  rank: string;
}

/** Fila del tablón ya mapeada a camelCase */
export interface TriviaLeaderboardEntry {
  id: string;
  userId: string | null;
  player: string;
  mode: string;
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  rank: string;
  verified: boolean;
  createdAt: string;
}

export type TriviaLeaderboardScope = 'all' | 'week';
