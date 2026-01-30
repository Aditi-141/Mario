// lib/game/engine.ts
import { createAudio } from "./audio";
import type { EngineDeps, Rect } from "./types";
import { WORLD, MAX_DT } from "./constants";
import { aabbOverlap, clamp } from "./math";
import { createLevel } from "./level";
import { createPlayer, respawnPlayer, updatePlayer } from "./player";
import { createEnemy, respawnEnemy, updateEnemy } from "./enemy";
import {
  drawPlatform,
  drawBlock,
  drawCoin,
  drawMario,
  drawCloud,
  drawVillain,
  drawPipe,
} from "./render";

export function createEngine(deps: EngineDeps) {
  const audio = createAudio();

  const level = createLevel();
  const player = createPlayer();
  const enemy = createEnemy();

  let running = false;
  let rafId = 0;
  let lastTime = 0;
  let accumulator = 0;

  const FIXED_DT = 1 / 120;

  let hudCoins = 0;

  // Tracks which blocks already awarded coins
  let rewardedBlocks = new WeakSet<object>();

  // HUD
  const emitHud = () => {
    deps.onHud({
      coins: hudCoins,
      grounded: player.grounded,
    });
  };

  // Simulation step
  const step = (dt: number) => {
    updatePlayer(player, level, deps.getInput(), audio, dt);
    updateEnemy(enemy, level, dt);

    // award coin once per block
    for (const b of level.blocks as any[]) {
      if (b.hit && !rewardedBlocks.has(b)) {
        rewardedBlocks.add(b);
        hudCoins++;
        audio.coin();
      }
    }

    // Coin pickup
    const pr: Rect = player;
    for (const c of level.coins) {
      if (c.taken) continue;
      const cr: Rect = {
        x: c.x - c.r,
        y: c.y - c.r,
        w: c.r * 2,
        h: c.r * 2,
      };
      if (aabbOverlap(pr, cr)) {
        c.taken = true;
        hudCoins++;
        audio.coin();
      }
    }

    // Player vs Enemy
    if (enemy.alive && aabbOverlap(player, enemy)) {
      const stomp = player.vy > 0 && player.y + player.h - enemy.y < 14;

      if (stomp) {
        enemy.alive = false;
        player.vy = -WORLD.jumpVel * 0.65;
        hudCoins += 3;
        audio.coin();
      } else {
        respawnPlayer(player);
        hudCoins = 0;
        audio.bump();
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
    [[120, 90], [360, 70], [720, 110]].forEach(([x, y]) =>
      drawCloud(ctx, x, y)
    );

    // Platforms
    level.platforms.forEach((p) => {
      (p as any).kind === "pipe" ? drawPipe(ctx, p) : drawPlatform(ctx, p);
    });

    // Blocks / Coins
    level.blocks.forEach((b) => drawBlock(ctx, b));
    level.coins.forEach((c) => {
      if (!c.taken) drawCoin(ctx, c);
    });

    // Characters
    drawVillain(ctx, enemy);
    drawMario(ctx, player);

    ctx.restore();

    // HUD (visual)
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(12, 12, 220, 44);
    ctx.fillStyle = "white";
    ctx.font = "700 18px system-ui";
    ctx.fillText(`Points: ${hudCoins}`, 22, 40);
    surface.present();
  };

  // Main loop
  const frame = (t: number) => {
    const dt = clamp((t - lastTime) / 1000, 0, MAX_DT);
    lastTime = t;

    accumulator += dt;
    let steps = 0;
    const MAX_STEPS = 8;
    while (accumulator >= FIXED_DT && steps < MAX_STEPS) {
      step(FIXED_DT);
      accumulator -= FIXED_DT;
      steps++;
    }

    render();
    emitHud();

    if (running) rafId = requestAnimationFrame(frame);
  };

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
    level.blocks.forEach((b: any) => (b.hit = false));
    level.coins.forEach((c) => (c.taken = false));

    //reset block rewards too
    rewardedBlocks = new WeakSet<object>();

    respawnPlayer(player);
    respawnEnemy(enemy);

    hudCoins = 0;
    accumulator = 0;
    emitHud();
  };

  return { start, stop, reset };
}
