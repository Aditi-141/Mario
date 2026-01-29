// lib/game/engine.ts
import { createAudio } from "./audio";
import type { EngineDeps, EngineHandle, Player, Level, Rect, Enemy } from "./types";
import { WORLD, MAX_DT, MAX_JUMPS, COYOTE_TIME } from "./constants";
import { aabbOverlap, clamp } from "./math";
import { resolveX, resolveY } from "./collision";
import {
  drawPlatform,
  drawBlock,
  drawCoin,
  drawMario,
  drawCloud,
  drawVillain,
  drawPipe,
} from "./render";

export function createEngine(deps: EngineDeps): EngineHandle {
  const audio = createAudio();

  // Matches your ground platform y.
  const GROUND_Y = 470;

  // Pipe sizing + placement (REAL collider that matches render)
  const PIPE_W = 64;
  const PIPE_H = 120;
  const PIPE_X = 820;
  const PIPE_TOP_Y = GROUND_Y - PIPE_H;

  const level: Level = {
    platforms: [
      // Ground
      { x: 0, y: GROUND_Y, w: WORLD.w, h: WORLD.h - GROUND_Y },

      // Mid platforms
      { x: 300, y: 300, w: 40, h: 40 },
      { x: 380, y: 300, w: 40, h: 40 },
      { x: 460, y: 300, w: 40, h: 40 },

      // Pipe collider (drawn as pipe)
      { x: PIPE_X, y: PIPE_TOP_Y, w: PIPE_W, h: PIPE_H },
    ],
    blocks: [
      { x: 40, y: 300, w: 40, h: 40, hit: false },
      { x: 340, y: 300, w: 40, h: 40, hit: false },
      { x: 420, y: 300, w: 40, h: 40, hit: false },
      { x: 460, y: 80, w: 40, h: 40, hit: false },
    ],
    coins: [
      { x: 320, y: 240, r: 10, taken: false },
      { x: 380, y: 240, r: 10, taken: false },
      { x: 440, y: 240, r: 10, taken: false },
      { x: 740, y: 240, r: 10, taken: false },
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

  // Simple villain (patrol + stomp)
  const enemy: Enemy = {
    x: 620,
    y: GROUND_Y - 34 - 0.01,
    w: 34,
    h: 34,
    vx: 70,
    vy: 0,
    grounded: false,
    facing: 1,
    alive: true,
  };

  let rafId = 0;
  let running = false;
  let lastTime = 0;
  let accumulator = 0;

  // Fixed-step physics helps prevent tunneling (also helps “order” issues feel better)
  const FIXED_DT = 1 / 120;

  let hudCoins = 0;
  const emitHud = () => deps.onHud({ coins: hudCoins, grounded: player.grounded });

  // Enemy collision helpers 
  const rectOf = (r: Rect): Rect => ({ x: r.x, y: r.y, w: r.w, h: r.h });

  const resolveEnemyX = () => {
    const er = rectOf(enemy);
    const colliders: Rect[] = [...level.platforms, ...level.blocks];

    for (const c of colliders) {
      if (!aabbOverlap(er, c)) continue;

      // push based on velocity direction (not centers)
      if (enemy.vx > 0) {
        enemy.x = c.x - enemy.w - 0.01;
      } else {
        enemy.x = c.x + c.w + 0.01;
      }

      enemy.vx = -enemy.vx;
      enemy.facing = enemy.vx < 0 ? -1 : 1;
      er.x = enemy.x;
    }
  };

  const resolveEnemyY = () => {
    enemy.grounded = false;
    const er = rectOf(enemy);
    const colliders: Rect[] = [...level.platforms, ...level.blocks];

    for (const c of colliders) {
      if (!aabbOverlap(er, c)) continue;

      if (enemy.vy > 0) {
        enemy.y = c.y - enemy.h - 0.01;
        enemy.vy = 0;
        enemy.grounded = true;
      } else if (enemy.vy < 0) {
        enemy.y = c.y + c.h + 0.01;
        if (enemy.vy < 0) enemy.vy = 40;
      } else {
        // minimal push out if resting overlap
        const up = er.y + er.h - c.y;
        const down = c.y + c.h - er.y;
        enemy.y += up < down ? -(up + 0.01) : down + 0.01;
      }

      er.y = enemy.y;
    }
  };

  //  Simulation step
  const step = (dt: number) => {
    const input = deps.getInput();

    const jumpPressed = input.jumpPressedThisFrame;
    input.jumpPressedThisFrame = false;

    // Horizontal
    const accel = player.grounded ? WORLD.moveSpeed : WORLD.airMoveSpeed;
    const targetVx = input.left ? -accel : input.right ? accel : 0;
    const smoothing = player.grounded ? 0.2 : 0.1;
    player.vx += (targetVx - player.vx) * smoothing;

    const friction = player.grounded ? WORLD.friction : WORLD.airFriction;
    player.vx *= Math.pow(friction, dt / (1 / 60));
    if (Math.abs(player.vx) < 1) player.vx = 0;

    if (input.left) player.facing = -1;
    else if (input.right) player.facing = 1;

    // Gravity
    player.vy = clamp(player.vy + WORLD.gravity * dt, -9999, WORLD.maxFall);

    // Coyote
    player.coyote = player.grounded ? COYOTE_TIME : Math.max(0, player.coyote - dt);

    // Jump
    if (jumpPressed && (player.grounded || player.coyote > 0 || player.jumpsLeft > 0)) {
      player.vy = -WORLD.jumpVel;
      player.grounded = false;
      player.coyote = 0;
      player.jumpsLeft--;
      audio.jump();
    }

    // Integrate X + resolve
    player.x = player.x + player.vx * dt;
    player.x = clamp(player.x, 0, WORLD.w - player.w);
    resolveX(player, level);

    // Integrate Y + resolve
    player.y = player.y + player.vy * dt;
    const { coinsDelta } = resolveY(player, level, audio);
    if (coinsDelta) hudCoins += coinsDelta;
    player.y = clamp(player.y, -2000, WORLD.h - player.h);

    // Enemy update
    if (enemy.alive) {
      enemy.vy = clamp(enemy.vy + WORLD.gravity * dt, -9999, WORLD.maxFall);

      enemy.x = enemy.x + enemy.vx * dt;
      enemy.x = clamp(enemy.x, 0, WORLD.w - enemy.w);
      resolveEnemyX();

      enemy.y = enemy.y + enemy.vy * dt;
      resolveEnemyY();
      enemy.y = clamp(enemy.y, -2000, WORLD.h - enemy.h);

      if (Math.abs(enemy.vx) < 10) enemy.vx = enemy.facing * 70;
    }

    // Coin pickup
    const pr: Rect = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const c of level.coins) {
      if (c.taken) continue;
      const coinRect: Rect = { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 };
      if (aabbOverlap(pr, coinRect)) {
        c.taken = true;
        hudCoins++;
        audio.coin();
      }
    }

    // Player vs Enemy
    if (enemy.alive) {
      const er: Rect = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };

      if (aabbOverlap(pr, er)) {
        const playerBottom = player.y + player.h;
        const enemyTop = enemy.y;
        const falling = player.vy > 0;
        const stomp = falling && playerBottom - enemyTop < 14;

        if (stomp) {
          enemy.alive = false;
          player.vy = -WORLD.jumpVel * 0.65;
          hudCoins += 3;
          audio.coin();
        } else {
          Object.assign(player, {
            x: 60,
            y: 400,
            vx: 0,
            vy: 0,
            grounded: false,
            facing: 1,
            coyote: 0,
            jumpsLeft: MAX_JUMPS,
          });
          hudCoins = 0;
          audio.bump();
        }
      }
    }
  };

  // Render
  const render = () => {
    const surface = deps.getSurface();
    if (!surface) return;

    const ctx = surface.offCtx;
    const cssW = surface.cssW;
    const cssH = surface.cssH;

    // Draw in CSS pixel space
    ctx.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, 0, cssW, cssH);

    // Fit WORLD into surface
    const scale = Math.min(cssW / WORLD.w, cssH / WORLD.h);
    const offsetX = (cssW - WORLD.w * scale) / 2;
    const offsetY = (cssH - WORLD.h * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Clouds
    [[120, 90], [360, 70], [720, 110]].forEach(([x, y]) => drawCloud(ctx as any, x, y));

    // Platforms (pipe drawn where its collider actually is)
    level.platforms.forEach((p) => {
      if (p.x === PIPE_X && p.y === PIPE_TOP_Y && p.w === PIPE_W && p.h === PIPE_H) {
        drawPipe(ctx as any, p);
      } else {
        drawPlatform(ctx as any, p);
      }
    });

    // Blocks / coins
    level.blocks.forEach((b) => drawBlock(ctx as any, b));
    level.coins.forEach((c) => {
      if (!c.taken) drawCoin(ctx as any, c);
    });

    // Characters
    drawVillain(ctx as any, enemy);
    drawMario(ctx as any, player);

    ctx.restore();

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(12, 12, 220, 44);
    ctx.fillStyle = "white";
    ctx.font = "700 18px system-ui";
    ctx.fillText(`Coins: ${hudCoins}`, 22, 40);

    surface.present();
  };

  // Main loop
  const frame = (t: number) => {
    const dt = clamp((t - lastTime) / 1000, 0, MAX_DT);
    lastTime = t;

    accumulator += dt;

    const maxSteps = 8;
    let steps = 0;
    while (accumulator >= FIXED_DT && steps < maxSteps) {
      step(FIXED_DT);
      accumulator -= FIXED_DT;
      steps++;
    }

    render();
    emitHud();

    if (running) rafId = requestAnimationFrame(frame);
  };

  // Public API
  const start = () => {
    if (running) return;
    audio.ensure();
    audio.resume();

    running = true;
    deps.onRunning(true);

    accumulator = 0;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  };

  const stop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    deps.onRunning(false);
  };

  const reset = () => {
    level.blocks.forEach((b) => (b.hit = false));
    level.coins.forEach((c) => (c.taken = false));

    Object.assign(player, {
      x: 60,
      y: 400,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 1,
      coyote: 0,
      jumpsLeft: MAX_JUMPS,
    });

    Object.assign(enemy, {
      x: 620,
      y: GROUND_Y - 34 - 0.01,
      w: 34,
      h: 34,
      vx: 70,
      vy: 0,
      grounded: false,
      facing: 1,
      alive: true,
    });

    hudCoins = 0;
    accumulator = 0;
    emitHud();
  };

  return { start, stop, reset };
}
