import type { Enemy, Level, Rect } from "./types";
import { applyGravity, integrateX, integrateY } from "./physics";
import { aabbOverlap } from "./math";
import { GROUND_Y } from "./level";

export function createEnemy(): Enemy {
  return {
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
}

export function respawnEnemy(enemy: Enemy) {
  Object.assign(enemy, createEnemy());
}

export function updateEnemy(enemy: Enemy, level: Level, dt: number) {
  if (!enemy.alive) return;

  applyGravity(enemy, dt);
  integrateX(enemy, dt);
  resolveEnemyX(enemy, level);

  integrateY(enemy, dt);
  resolveEnemyY(enemy, level);

  if (Math.abs(enemy.vx) < 10) enemy.vx = enemy.facing * 70;
}

function resolveEnemyX(enemy: Enemy, level: Level) {
  const er: Rect = enemy;
  for (const c of [...level.platforms, ...level.blocks]) {
    if (!aabbOverlap(er, c)) continue;
    enemy.x = enemy.vx > 0 ? c.x - enemy.w - 0.01 : c.x + c.w + 0.01;
    enemy.vx = -enemy.vx;
    enemy.facing = enemy.vx < 0 ? -1 : 1;
  }
}

function resolveEnemyY(enemy: Enemy, level: Level) {
  enemy.grounded = false;
  const er: Rect = enemy;

  for (const c of [...level.platforms, ...level.blocks]) {
    if (!aabbOverlap(er, c)) continue;

    if (enemy.vy > 0) {
      enemy.y = c.y - enemy.h - 0.01;
      enemy.vy = 0;
      enemy.grounded = true;
    } else if (enemy.vy < 0) {
      enemy.y = c.y + c.h + 0.01;
      enemy.vy = 40;
    }
  }
}
