import { createAudio } from "./audio";
import type { InputState, Level, Player, Rect } from "./types";

/** Prefer interface for "contracts" / public shapes */
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

/** Pure helpers*/
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function aabbOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Constants: readonly + literal types */
const WORLD = {
  w: 960,
  h: 540,
  gravity: 2400,
  maxFall: 2200,
  moveSpeed: 320,
  airMoveSpeed: 280,
  jumpVel: 820,
  friction: 0.86,
  airFriction: 0.96,
} as const;

const MAX_DT = 0.033;
const COYOTE_TIME = 0.12;
const MAX_JUMPS = 2;

export function createEngine(deps: EngineDeps): EngineHandle {
  const audio = createAudio();

  // ---- state (engine-owned) ----
  const level: Level = {
    platforms: [
      { x: 0, y: 470, w: 960, h: 70 },
      { x: 160, y: 380, w: 180, h: 20 },
      { x: 420, y: 320, w: 160, h: 20 },
      { x: 640, y: 260, w: 200, h: 20 },
      { x: 740, y: 390, w: 140, h: 20 },
    ],
    blocks: [
      { x: 250, y: 340, w: 40, h: 40, hit: false },
      { x: 290, y: 340, w: 40, h: 40, hit: false },
      { x: 330, y: 340, w: 40, h: 40, hit: false },
    ],
    coins: [
      { x: 210, y: 350, r: 10, taken: false },
      { x: 460, y: 290, r: 10, taken: false },
      { x: 700, y: 230, r: 10, taken: false },
      { x: 780, y: 360, r: 10, taken: false },
    ],
  };

  const player: Player = {
    x: 60,
    y: 400,
    w: 34,
    h: 44,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    coyote: 0,
    jumpsLeft: MAX_JUMPS,
  };

  let rafId = 0;
  let isRunning = false;
  let lastTime = 0;

  let hudCoins = 0;
  let hudGrounded = false;

  // Edge-trigger inside engine (don’t mutate external input)
  let prevJumpHeld = false;

  // Reused rect (avoid allocations)
  const playerRect: Rect = { x: 0, y: 0, w: 0, h: 0 };

  function emitHudIfChanged() {
    if (hudGrounded !== player.grounded) {
      hudGrounded = player.grounded;
    }
    deps.onHud({ coins: hudCoins, grounded: hudGrounded });
  }

  function ensureCanvasSize(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const nextW = Math.floor(rect.width * dpr);
    const nextH = Math.floor(rect.height * dpr);

    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW;
      canvas.height = nextH;
      // draw in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function start() {
    if (isRunning) return;

    audio.ensure();
    audio.resume();

    isRunning = true;
    deps.onRunning(true);

    prevJumpHeld = false;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (!isRunning) return;

    isRunning = false;
    deps.onRunning(false);
    cancelAnimationFrame(rafId);
  }

  function reset() {
    for (const b of level.blocks) b.hit = false;
    for (const c of level.coins) c.taken = false;

    player.x = 60;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.facing = 1;
    player.coyote = 0;
    player.jumpsLeft = MAX_JUMPS;

    hudCoins = 0;
    hudGrounded = false;
    deps.onHud({ coins: hudCoins, grounded: hudGrounded });
  }

  function frame(t: number) {
    const dt = clamp((t - lastTime) / 1000, 0, MAX_DT);
    lastTime = t;

    update(dt);
    render();

    if (isRunning) rafId = requestAnimationFrame(frame);
  }

  function update(dt: number) {
    const input = deps.getInput();

    const jumpPressed = input.jumpHeld && !prevJumpHeld; // edge trigger
    prevJumpHeld = input.jumpHeld;

    const wasGrounded = player.grounded;

    // --- horizontal ---
    const accel = player.grounded ? WORLD.moveSpeed : WORLD.airMoveSpeed;

    if (input.left) {
      player.vx = -accel;
      player.facing = -1;
    } else if (input.right) {
      player.vx = accel;
      player.facing = 1;
    } else {
      player.vx *= player.grounded ? WORLD.friction : WORLD.airFriction;
      if (Math.abs(player.vx) < 6) player.vx = 0;
    }

    // --- gravity ---
    player.vy = clamp(player.vy + WORLD.gravity * dt, -9999, WORLD.maxFall);

    // --- coyote ---
    if (player.grounded) player.coyote = COYOTE_TIME;
    else player.coyote = Math.max(0, player.coyote - dt);

    // --- double jump ---
    if (jumpPressed && player.jumpsLeft > 0) {
      player.vy = -WORLD.jumpVel;
      player.grounded = false;
      player.coyote = 0;
      player.jumpsLeft -= 1;

      // sfx: 2nd jump different
      if (player.jumpsLeft === 0) audio.bump();
      else audio.jump();
    }

    // --- integrate X + resolve ---
    player.x = clamp(player.x + player.vx * dt, 0, WORLD.w - player.w);
    resolveCollisionsX();

    // --- integrate Y + resolve ---
    player.y = clamp(player.y + player.vy * dt, -2000, WORLD.h - player.h);
    resolveCollisionsY();

    // --- coins ---
    playerRect.x = player.x;
    playerRect.y = player.y;
    playerRect.w = player.w;
    playerRect.h = player.h;

    for (const c of level.coins) {
      if (c.taken) continue;
      const coinRect: Rect = { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 };
      if (aabbOverlap(playerRect, coinRect)) {
        c.taken = true;
        hudCoins += 1;
        deps.onHud({ coins: hudCoins, grounded: hudGrounded });
        audio.coin();
      }
    }

    emitHudIfChanged();
  }

  function resolveCollisionsX() {
    // reuse rect
    playerRect.x = player.x;
    playerRect.y = player.y;
    playerRect.w = player.w;
    playerRect.h = player.h;

    // platforms
    for (const s of level.platforms) {
      if (!aabbOverlap(playerRect, s)) continue;

      const fromLeft = playerRect.x + playerRect.w / 2 < s.x + s.w / 2;
      player.x = fromLeft ? s.x - player.w - 0.01 : s.x + s.w + 0.01;
      player.vx = 0;

      playerRect.x = player.x;
    }

    // blocks
    for (const b of level.blocks) {
      if (!aabbOverlap(playerRect, b)) continue;

      const fromLeft = playerRect.x + playerRect.w / 2 < b.x + b.w / 2;
      player.x = fromLeft ? b.x - player.w - 0.01 : b.x + b.w + 0.01;
      player.vx = 0;

      playerRect.x = player.x;
    }
  }

  function resolveCollisionsY() {
    player.grounded = false;

    // reuse rect
    playerRect.x = player.x;
    playerRect.y = player.y;
    playerRect.w = player.w;
    playerRect.h = player.h;

    // platforms
    for (const s of level.platforms) {
      if (!aabbOverlap(playerRect, s)) continue;

      const fromAbove = playerRect.y + playerRect.h / 2 < s.y + s.h / 2;

      if (fromAbove) {
        player.y = s.y - player.h - 0.01;
        player.vy = 0;
        player.grounded = true;
        player.jumpsLeft = MAX_JUMPS;
      } else {
        player.y = s.y + s.h + 0.01;
        if (player.vy < 0) player.vy = 80;
      }

      playerRect.y = player.y;
    }

    // blocks (also detect head hits)
    for (const b of level.blocks) {
      if (!aabbOverlap(playerRect, b)) continue;

      const fromAbove = playerRect.y + playerRect.h / 2 < b.y + b.h / 2;

      if (fromAbove) {
        player.y = b.y - player.h - 0.01;
        player.vy = 0;
        player.grounded = true;
        player.jumpsLeft = MAX_JUMPS;
      } else {
        player.y = b.y + b.h + 0.01;
        if (player.vy < 0) player.vy = 80;

        // hit head on block
        b.hit = true;
        audio.bump();
      }

      playerRect.y = player.y;
    }
  }

  function render() {
    const canvas = deps.getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ensureCanvasSize(ctx, canvas);

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;

    const scale = Math.min(cssW / WORLD.w, cssH / WORLD.h);
    const offsetX = (cssW - WORLD.w * scale) / 2;
    const offsetY = (cssH - WORLD.h * scale) / 2;

    ctx.clearRect(0, 0, cssW, cssH);

    // sky
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawCloud(ctx, 120, 90);
    drawCloud(ctx, 360, 70);
    drawCloud(ctx, 720, 110);

    // platforms
    for (const plat of level.platforms) {
      if (plat.y >= 450) {
        ctx.fillStyle = "#14532d";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(plat.x, plat.y, plat.w, 14);
      } else {
        ctx.fillStyle = "#9a3412";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = "#c2410c";
        ctx.fillRect(plat.x, plat.y, plat.w, 6);
      }
    }

    // blocks
    for (const b of level.blocks) {
      ctx.fillStyle = b.hit ? "#a3a3a3" : "#f59e0b";
      ctx.fillRect(b.x, b.y, b.w, b.h);

      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);

      ctx.fillStyle = "#111827";
      ctx.font = "bold 22px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.hit ? "!" : "?", b.x + b.w / 2, b.y + b.h / 2 + 1);
    }

    // coins
    for (const c of level.coins) {
      if (c.taken) continue;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = "#facc15";
      ctx.fill();
      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(c.x - 3, c.y - 3, c.r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fill();
    }

    drawMario(ctx, player.x, player.y, player.w, player.h, player.facing);

    ctx.restore();

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(12, 12, 320, 56);
    ctx.fillStyle = "white";
    ctx.font = "600 16px system-ui";
    ctx.fillText(`Coins: ${hudCoins}`, 22, 34);
  }

  function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 8, 22, 0, Math.PI * 2);
    ctx.arc(x + 44, y, 18, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawMario(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    facing: 1 | -1
  ) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(facing, 1);
    ctx.translate(-(x + w / 2), -(y + h / 2));

    ctx.fillStyle = "#111827";
    ctx.fillRect(x + 4, y + h - 10, 12, 8);
    ctx.fillRect(x + w - 16, y + h - 10, 12, 8);

    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(x + 6, y + 20, w - 12, 22);

    ctx.fillStyle = "#dc2626";
    ctx.fillRect(x + 6, y + 14, w - 12, 12);

    ctx.fillStyle = "#f5c9a6";
    ctx.fillRect(x + 9, y + 2, w - 18, 16);

    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(x + 7, y, w - 14, 8);

    ctx.fillStyle = "#111827";
    ctx.fillRect(x + 21, y + 8, 3, 3);

    ctx.fillStyle = "#7c2d12";
    ctx.fillRect(x + 14, y + 14, 14, 3);

    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    ctx.restore();
  }

  return { start, stop, reset };
}
