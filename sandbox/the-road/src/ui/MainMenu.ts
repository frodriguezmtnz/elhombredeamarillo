import type { Quality, RoadSettings } from '../core/Settings';

type NumericSettingKey = 'sensitivity' | 'masterVolume' | 'ambientVolume' | 'effectsVolume';

export interface MenuCallbacks {
  onStart: () => void;
  onExit: () => void;
  onResume: () => void;
  onExitToMenu: () => void;
  onFullscreenToggle: () => void;
  onChange: () => void;
}

/**
 * Menú principal, panel de ajustes y menú de pausa.
 * Paneles mutuamente excluyentes dentro de #ui-root.
 */
export class MainMenu {
  private root: HTMLElement;
  private menuEl: HTMLElement;
  private settingsEl: HTMLElement;
  private pauseEl: HTMLElement;
  private callbacks: MenuCallbacks;
  private getSettings: () => Readonly<RoadSettings>;
  private setSetting: (key: NumericSettingKey, value: number) => void;
  private setQuality: (quality: Quality) => void;
  private settingsSource: 'main' | 'pause' = 'main';

  constructor(
    root: HTMLElement,
    callbacks: MenuCallbacks,
    getSettings: () => Readonly<RoadSettings>,
    setSetting: (key: NumericSettingKey, value: number) => void,
    setQuality: (quality: Quality) => void,
  ) {
    this.root = root;
    this.callbacks = callbacks;
    this.getSettings = getSettings;
    this.setSetting = setSetting;
    this.setQuality = setQuality;

    this.menuEl = this.buildMainMenu();
    this.settingsEl = this.buildSettings();
    this.pauseEl = this.buildPause();
    this.root.append(this.menuEl, this.settingsEl, this.pauseEl);
    window.addEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.code !== 'Enter' && event.code !== 'NumpadEnter') return;
    if (this.menuEl.style.display === 'flex') this.callbacks.onStart();
    else if (this.pauseEl.style.display === 'flex') this.callbacks.onResume();
  };

  private buildMainMenu(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'menu';
    el.style.display = 'none';
    el.innerHTML = `
      <div>
        <div class="title">THE ROAD</div>
        <div class="subtitle" style="text-align:center">you will not leave</div>
      </div>
      <nav>
        <button data-action="start">Start</button>
        <button data-action="settings">Settings</button>
        <button data-action="exit">Exit</button>
      </nav>
      <div class="hint">WASD drive / move · SHIFT run · high beams (driving) · mouse look · C camera · E interact · ESC pause · F3 debug</div>
    `;
    for (const button of el.querySelectorAll('button')) {
      button.addEventListener('click', () => {
        const action = (button as HTMLElement).dataset.action;
        if (action === 'start') this.callbacks.onStart();
        else if (action === 'settings') this.openSettings('main');
        else if (action === 'exit') this.callbacks.onExit();
      });
    }
    return el;
  }

  private buildSettings(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'menu';
    el.style.display = 'none';
    el.innerHTML = `
      <div class="settings panel">
        <h2>Settings</h2>
        <div class="row"><label>Graphics</label><div class="seg" data-key="quality">
          <button data-value="low">Low</button><button data-value="medium">Medium</button><button data-value="high">High</button>
        </div></div>
        <div class="row"><label>Fullscreen</label><button class="fs" data-value="fs" style="background:none;border:none;color:var(--road-ink);cursor:pointer;font-size:0.8rem;letter-spacing:0.18em">TOGGLE</button></div>
        <div class="row"><label>Mouse sensitivity</label><input type="range" data-key="sensitivity" min="0.2" max="3" step="0.05"/></div>
        <div class="row"><label>Master volume</label><input type="range" data-key="masterVolume" min="0" max="1" step="0.05"/></div>
        <div class="row"><label>Ambient volume</label><input type="range" data-key="ambientVolume" min="0" max="1" step="0.05"/></div>
        <div class="row"><label>Effects volume</label><input type="range" data-key="effectsVolume" min="0" max="1" step="0.05"/></div>
        <button class="close" data-action="back">Back</button>
      </div>
    `;
    for (const button of el.querySelectorAll('.seg [data-value]')) {
      button.addEventListener('click', () => {
        this.setQuality((button as HTMLElement).dataset.value as Quality);
        this.syncControls();
      });
    }
    for (const node of el.querySelectorAll('input[type="range"]')) {
      const input = node as HTMLInputElement;
      input.addEventListener('input', () => {
        const key = input.dataset.key as NumericSettingKey;
        this.setSetting(key, Number(input.value));
        this.callbacks.onChange();
      });
    }
    el.querySelector('[data-value="fs"]')?.addEventListener('click', () => this.callbacks.onFullscreenToggle());
    el.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      this.settingsEl.style.display = 'none';
      if (this.settingsSource === 'pause') this.showPause();
      else this.showMenu();
    });
    return el;
  }

  private buildPause(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'menu';
    el.style.display = 'none';
    el.innerHTML = `
      <div class="title" style="font-size:2rem">PAUSED</div>
      <nav>
        <button data-action="resume">Resume</button>
        <button data-action="settings">Settings</button>
        <button data-action="menu">Exit to Menu</button>
      </nav>
    `;
    for (const button of el.querySelectorAll('button')) {
      button.addEventListener('click', () => {
        const action = (button as HTMLElement).dataset.action;
        if (action === 'resume') this.callbacks.onResume();
        else if (action === 'settings') this.openSettings('pause');
        else if (action === 'menu') this.callbacks.onExitToMenu();
      });
    }
    return el;
  }

  private openSettings(source: 'main' | 'pause'): void {
    this.settingsSource = source;
    this.menuEl.style.display = 'none';
    this.pauseEl.style.display = 'none';
    this.settingsEl.style.display = 'flex';
    this.syncControls();
  }

  private syncControls(): void {
    const s = this.getSettings();
    const el = this.settingsEl;
    for (const button of el.querySelectorAll('.seg [data-value]')) {
      button.classList.toggle('active', (button as HTMLElement).dataset.value === s.quality);
    }
    for (const key of ['sensitivity', 'masterVolume', 'ambientVolume', 'effectsVolume'] as const) {
      const input = el.querySelector(`input[data-key="${key}"]`) as HTMLInputElement | null;
      if (input) input.value = String(s[key]);
    }
  }

  showMenu(): void {
    this.closeAll();
    this.menuEl.style.display = 'flex';
  }

  showPause(): void {
    this.closeAll();
    this.pauseEl.style.display = 'flex';
  }

  private closeAll(): void {
    this.menuEl.style.display = 'none';
    this.settingsEl.style.display = 'none';
    this.pauseEl.style.display = 'none';
  }

  hideAll(): void {
    this.closeAll();
  }

  get anyPanelOpen(): boolean {
    return (
      this.menuEl.style.display === 'flex' ||
      this.settingsEl.style.display === 'flex' ||
      this.pauseEl.style.display === 'flex'
    );
  }
}
