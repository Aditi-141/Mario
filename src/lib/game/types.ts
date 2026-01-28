export type Facing = 1 | -1;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Platform = Rect;

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

export interface InputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressedThisFrame: boolean;
}

export interface GameCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export interface EngineDeps {
  getCanvas(): HTMLCanvasElement | null;
  getInput(): InputState;
  onHud(hud: { coins: number; grounded: boolean }): void;
  onRunning(running: boolean): void;
}

export interface EngineHandle {
  start(): void;
  stop(): void;
  reset(): void;
}