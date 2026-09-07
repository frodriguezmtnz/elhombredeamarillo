import { controls } from '../core/ControlsConfig';
import type { DialogueSystem } from '../npc/DialogueSystem';
import type { DialogueViewState } from '../npc/DialogueSystem';

/** Panel de diálogo: hablante, línea y opciones (click o teclas 1-4). */
export class DialogueUI {
  private readonly root: HTMLElement;
  private speakerEl: HTMLElement;
  private lineEl: HTMLElement;
  private optionsEl: HTMLElement;
  private continueEl: HTMLElement;

  constructor(
    root: HTMLElement,
    private dialogue: DialogueSystem,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'dialogue';
    this.root.innerHTML = `
      <div class="speaker"></div>
      <div class="line"></div>
      <div class="options"></div>
      <div class="continue">E · continue</div>
    `;
    root.appendChild(this.root);
    this.speakerEl = this.root.querySelector('.speaker') as HTMLElement;
    this.lineEl = this.root.querySelector('.line') as HTMLElement;
    this.optionsEl = this.root.querySelector('.options') as HTMLElement;
    this.continueEl = this.root.querySelector('.continue') as HTMLElement;
    window.addEventListener('keydown', this.handleKey);
  }

  private handleKey = (event: KeyboardEvent): void => {
    if (!this.dialogue.open) return;
    const digits = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
    const digitIndex = digits.indexOf(event.code);
    if (digitIndex >= 0) {
      this.dialogue.choose(digitIndex);
      this.render();
      return;
    }
    if (event.code === controls.code('interact') || event.code === 'Enter') {
      const view = this.dialogue.view();
      if (view && view.options.length === 1) {
        this.dialogue.choose(0);
      } else if (view) {
        // avanzar a la primera opción no salir? no: E con varias opciones no hace nada
      }
      this.render();
    }
  };

  render(): void {
    const view: DialogueViewState | null = this.dialogue.view();
    if (!this.dialogue.open || !view) {
      this.root.classList.remove('open');
      return;
    }
    this.root.classList.add('open');
    this.speakerEl.textContent = view.speaker;
    this.lineEl.textContent = view.text;
    this.optionsEl.innerHTML = '';
    view.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.textContent = `${index + 1}. ${option.text}`;
      button.addEventListener('click', () => {
        this.dialogue.choose(index);
        this.render();
      });
      this.optionsEl.appendChild(button);
    });
    this.continueEl.style.display = view.options.length === 1 ? 'block' : 'none';
  }

  close(): void {
    this.root.classList.remove('open');
  }
}
