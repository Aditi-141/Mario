import { createAudio } from "./audio";
import type { EngineDeps, EngineHandle, Player, Level, Rect } from "./types";
import { WORLD, MAX_DT, MAX_JUMPS, COYOTE_TIME } from "./constants";
import { aabbOverlap, clamp } from "./math";
import { resolveX, resolveY } from "./collision";
import { drawPlatform, drawBlock, drawCoin, drawMario, drawCloud } from "./render";

export function createEngine(deps: EngineDeps): EngineHandle {
  const audio = createAudio();

  const level: Level = {
    platforms: [
      { x: 0, y: 470, w: 960, h: 70 },
      { x: 300, y: 300, w: 40, h: 40 },
      { x: 380, y: 300, w: 40, h: 40 },
      { x: 460, y: 300, w: 40, h: 40 },
      { x: 740, y: 390, w: 40, h: 40 },
    ],
    blocks: [
      { x: 40, y: 300, w: 40, h: 40, hit: false },
      { x: 340, y: 300, w: 40, h: 40, hit: false },
      { x: 420, y: 300, w: 40, h: 40, hit: false },
      { x: 460, y: 80, w: 40, h: 40, hit: false },
      { x: 450, y: 540, w: 40, h: 40, hit: false },

    ],
    coins: [
      { x: 320,  y: 240, r: 10, taken: false },
      { x: 380, y: 240, r: 10, taken: false },
      { x: 440, y: 240, r: 10, taken: false },
      { x: 740, y: 240, r: 10, taken: false },
    ],
  };

  const player: Player = {
    x: 60, y: 400, w: 34, h: 44,
    vx: 0, vy: 0, grounded: false, facing: 1,
    coyote: 0, jumpsLeft: MAX_JUMPS,
  };

  let rafId = 0, isRunning = false, lastTime = 0;
  let hudCoins = 0, prevJumpHeld = false;
  const playerRect: Rect = { x: 0, y: 0, w: 0, h: 0 };

  const emitHud = () => deps.onHud({ coins: hudCoins, grounded: player.grounded });

  /**
   * ensureCanvasSize ensures that a <canvas> element matches the size of its parent container in pixels, taking into account the device’s pixel ratio (DPR), which is important for high-DPI / Retina screens.
   * @param ctx The 2D rendering context of the canvas
   * @param canvas The <canvas> DOM element that you want to resize.
   * @returns void
   */
  const ensureCanvasSize = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };

  /**
   * Updates the player state and game world according to inputs, physics, and collisions.
   * @param dt dt is the delta time (time elapsed since the last frame, in seconds)
   */
  const update = (dt: number) => {
    const input = deps.getInput();
    const jumpPressed = input.jumpHeld && !prevJumpHeld;
    prevJumpHeld = input.jumpHeld;

    // Horizontal movement
    const accel = player.grounded ? WORLD.moveSpeed : WORLD.airMoveSpeed;
    const targetVx = input.left ? -accel : input.right ? accel : 0;
    const smoothing = player.grounded ? 0.2 : 0.1;
    player.vx += (targetVx - player.vx) * smoothing;
    const friction = player.grounded ? WORLD.friction : WORLD.airFriction;
    player.vx *= Math.pow(friction, dt / (1/60));
    if (Math.abs(player.vx) < 1) player.vx = 0;
    if (input.left) player.facing = -1; else if (input.right) player.facing = 1;

    // Vertical movement
    player.vy = clamp(player.vy + WORLD.gravity * dt, -9999, WORLD.maxFall);

    // Coyote time
    player.coyote = player.grounded ? COYOTE_TIME : Math.max(0, player.coyote - dt);

    // Jumping
    if (jumpPressed && player.jumpsLeft > 0) {
      player.vy = -WORLD.jumpVel;
      player.grounded = false;
      player.coyote = 0;
      player.jumpsLeft--;
      player.jumpsLeft === 0 ? audio.bump() : audio.jump();
              

    }

    // Integrate position
    player.x = clamp(player.x + player.vx * dt, 0, WORLD.w - player.w);
    resolveX(player, level);
    player.y = clamp(player.y + player.vy * dt, -2000, WORLD.h - player.h);
    resolveY(player, level, audio,hudCoins);

    // Coin collection
    playerRect.x = player.x; playerRect.y = player.y; playerRect.w = player.w; playerRect.h = player.h;
    for (const c of level.coins) {
      if (c.taken) continue;
      const coinRect = { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 };
      if (aabbOverlap(playerRect, coinRect)) {
        c.taken = true;
        hudCoins++;
        deps.onHud({ coins: hudCoins, grounded: player.grounded });
        audio.coin();
      }
    }

    emitHud();
  };

  /**
   * This funtions renders the characters
   */
  const render = () => {
    const canvas = deps.getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ensureCanvasSize(ctx, canvas);
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = canvas.width / dpr, cssH = canvas.height / dpr;
    const scale = Math.min(cssW / WORLD.w, cssH / WORLD.h);
    const offsetX = (cssW - WORLD.w * scale) / 2;
    const offsetY = (cssH - WORLD.h * scale) / 2;

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#3b82f6"; ctx.fillRect(0, 0, cssW, cssH);

    ctx.save(); ctx.translate(offsetX, offsetY); ctx.scale(scale, scale);
    [[120, 90], [360, 70], [720, 110]].forEach(([x, y]) => drawCloud(ctx, x, y));
    level.platforms.forEach(p => drawPlatform(ctx, p));
    level.blocks.forEach(b => drawBlock(ctx, b));
    level.coins.forEach(c => { if (!c.taken) drawCoin(ctx, c); });

    drawMario(ctx, player);
    ctx.restore();

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(12, 12, 320, 56);
    ctx.fillStyle = "white";
    ctx.font = "600 16px system-ui";
    ctx.fillText(`Coins: ${hudCoins}`, 22, 34);
  };

  /**
   * This function is frame is the main loop function for an animation or game.
   * @param t t is the current timestamp provided by requestAnimationFrame
   */
  const frame = (t: number) => {
    const dt = clamp((t - lastTime) / 1000, 0, MAX_DT);
    lastTime = t;
    update(dt);
    render();
    if (isRunning) rafId = requestAnimationFrame(frame);
  };

  /**
   * This function prepares all necessary state and begins a timed loop with audio.
   */
  const start = () => {
    if (isRunning) return;
    audio.ensure();
    audio.resume();
    isRunning = true;
    deps.onRunning(true);
    prevJumpHeld = false;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  };

  /**
   * This function resets the game
   */
  const reset = () => {
    level.blocks.forEach(b => (b.hit = false));
    level.coins.forEach(c => (c.taken = false));
    Object.assign(player, { x: 60, y: 400, vx: 0, vy: 0, grounded: false, facing: 1, coyote: 0, jumpsLeft: MAX_JUMPS });
    hudCoins = 0;
    emitHud();
  };

  return { start, stop, reset };
}
