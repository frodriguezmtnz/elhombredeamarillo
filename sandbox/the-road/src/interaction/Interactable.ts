import type * as THREE from 'three';

/** Punto interactivo del mundo (examinar árbol, entrar al coche, hablar con NPC...). */
export interface Interactable {
  readonly id: string;
  readonly position: THREE.Vector3;
  /** distancia máxima de activación */
  radius: number;
  /** etiqueta mostrada en el prompt, p.ej. "Examine the trunk" */
  label: string;
  active: boolean;
  /** se ejecuta al pulsar E */
  use: () => void;
}
