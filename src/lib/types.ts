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
