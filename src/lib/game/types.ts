export type Facing = 1 | -1;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Rect {}

export interface Block extends Rect {
  hit: boolean;
}

export interface Coin {
  x: number;
  y: number;
  r: number;
  taken: boolean;
}

export interface Level {
  platforms: Platform[];
  blocks: Block[];
  coins: Coin[];
}

export interface Player extends Rect {
  vx: number;
  vy: number;
  grounded: boolean;
  facing: Facing;
  coyote: number;
  jumpsLeft: number;
}

export interface Enemy extends Rect {
  vx: number;
  vy: number;
  grounded: boolean;
  facing: Facing;
  alive: boolean;
}

export interface InputState extends PlayerInput{
  jumpHeld: boolean;
}

/** A render surface: engine draws to `offCtx`, then calls `present()` */
export type RenderSurface = {
  dpr: number;
  cssW: number;
  cssH: number;
  offscreen: OffscreenCanvas | HTMLCanvasElement;
  offCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  present(): void;
};

export interface EngineDeps {
  getSurface(): RenderSurface | null;
  getInput(): InputState;
  onHud(hud: { coins: number; grounded: boolean }): void;
  onRunning(running: boolean): void;
}

export interface EngineHandle {
  start(): void;
  stop(): void;
  reset(): void;
}

export interface GameCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSurface(surface: RenderSurface | null): void;
}

export interface GameHud{
  coins: number;
  grounded: boolean;
};

export interface GameShellProps {
  running: boolean;
  hud: GameHud;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSurface: (s: RenderSurface | null) => void;
  onStart: () => void;
  onReset: () => void;
  onStop: () => void;
  onInput: (updater: (prev: InputState) => InputState) => void;
};

export interface Window {
  webkitAudioContext?: typeof AudioContext;
}

export interface AudioHandle {
  ensure(): boolean;
  resume(): void;
  jump(): void;
  land(): void;
  coin(): void;
  bump(): void;
};

export interface PlayerInput {
  left: boolean
  right: boolean
  jump: boolean
  attack: boolean
  jumpPressedThisFrame: boolean
  moveX: number
  moveY: number
}
