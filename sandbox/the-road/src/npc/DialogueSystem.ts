import { DIALOGUES } from './dialogues';
import type { DialogueOption, DialogueTree } from './dialogues';

export interface DialogueViewState {
  speaker: string;
  text: string;
  options: DialogueOption[];
}

/**
 * DialogueSystem — motor de árboles con flags y condiciones de loop.
 * Sin dependencias; estado local por partida.
 */
export class DialogueSystem {
  private tree: DialogueTree | null = null;
  private nodeId: string | null = null;
  private readonly flags = new Set<string>();
  private loops = 0;

  onClose: (() => void) | null = null;
  onFlag: ((flag: string) => void) | null = null;

  get open(): boolean {
    return this.tree !== null && this.nodeId !== null;
  }

  setLoops(loops: number): void {
    this.loops = loops;
  }

  hasFlag(flag: string): boolean {
    return this.flags.has(flag);
  }

  start(npcKey: string): boolean {
    const tree = DIALOGUES[npcKey];
    if (!tree) return false;
    this.tree = tree;
    this.nodeId = tree.start;
    return true;
  }

  view(): DialogueViewState | null {
    if (!this.tree || !this.nodeId) return null;
    const node = this.tree.nodes[this.nodeId];
    if (!node) return null;
    const options = (node.options ?? [{ text: '(Leave)', next: 'END' }]).filter(
      (option) =>
        (!option.requires || this.flags.has(option.requires)) &&
        (!option.hiddenIf || !this.flags.has(option.hiddenIf)) &&
        (option.requiresLoop === undefined || this.loops >= option.requiresLoop),
    );
    return { speaker: this.tree.speaker, text: node.text, options };
  }

  /** elige opción por índice; devuelve false si cerró */
  choose(index: number): boolean {
    const state = this.view();
    if (!state || !this.tree || !this.nodeId) return false;
    const option = state.options[index];
    if (!option) return false;
    for (const flag of option.set ?? []) {
      this.flags.add(flag);
      this.onFlag?.(flag);
    }
    if (option.next === 'END') {
      this.close();
      return false;
    }
    if (this.tree.nodes[option.next]) this.nodeId = option.next;
    else this.close();
    return this.open;
  }

  close(): void {
    const wasOpen = this.open;
    this.tree = null;
    this.nodeId = null;
    if (wasOpen) this.onClose?.();
  }
}
