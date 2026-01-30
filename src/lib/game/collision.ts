// lib/game/collision.ts
import type { Player, Rect, Level, Block } from "./types";
import { aabbOverlap } from "./math";
import { MAX_JUMPS } from "./constants";
import type { AudioHandle } from "./types";

const EPS = 0.01;

function rectOfPlayer(p: Player): Rect {
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

function centerX(r: Rect) {
  return r.x + r.w / 2;
}

function centerY(r: Rect) {
  return r.y + r.h / 2;
}

/**
 * Sort colliders so we resolve the closest ones first.
 * This reduces "order-dependent" jitter/misses when overlapping multiple tiles.
 * @param rect coordinates of object
 * @param rects multiple coordinates of object
 */
function sortByProximity(rect: Rect, rects: Rect[]) {
  const cx = centerX(rect);
  const cy = centerY(rect);
  rects.sort((a, b) => {
    const da = Math.abs(centerX(a) - cx) + Math.abs(centerY(a) - cy);
    const db = Math.abs(centerX(b) - cx) + Math.abs(centerY(b) - cy);
    return da - db;
  });
}

/**
 * Resolve X collisions (horizontal).
 * Assumes engine already updated player.x by vx * dt.
 * Uses velocity direction to decide which side to push out.
 * @param player Attributes of player
 * @param level Map layout
 */
export function resolveX(player: Player, level: Level) {
  const rect = rectOfPlayer(player);

  const colliders: Rect[] = [...level.platforms, ...level.blocks];
  sortByProximity(rect, colliders);

  // If vx is ~0 but we're overlapping (rare), fall back to minimal push-out.
  const movingRight = player.vx > 0.0001;
  const movingLeft = player.vx < -0.0001;

  for (const r of colliders) {
    if (!aabbOverlap(rect, r)) continue;

    if (movingRight) {
      // Player moving right -> hit left face of collider
      player.x = r.x - rect.w - EPS;
      player.vx = 0;
    } else if (movingLeft) {
      // Player moving left -> hit right face of collider
      player.x = r.x + r.w + EPS;
      player.vx = 0;
    } else {
      // Not moving horizontally: resolve by smallest penetration
      const overlapLeft = rect.x + rect.w - r.x; // push left amount
      const overlapRight = r.x + r.w - rect.x;  // push right amount

      if (overlapLeft < overlapRight) {
        player.x -= overlapLeft + EPS;
      } else {
        player.x += overlapRight + EPS;
      }
      player.vx = 0;
    }

    rect.x = player.x; // keep rect synced
  }
}

/**
 * Resolve Y collisions (vertical).
 * Assumes engine already updated player.y by vy * dt.
 * Uses velocity direction to decide landing vs head-bonk.
 * Returns events rather than mutating HUD.
 * @param player attributes of player
 * @param level map layout
 * @param audio sound for movements
 * @returns 
 */
export function resolveY(
  player: Player,
  level: Level,
  audio: AudioHandle
): { coinsDelta: number; hitBlocks: Block[] } {
  let coinsDelta = 0;
  const hitBlocks: Block[] = [];

  player.grounded = false;

  const rect = rectOfPlayer(player);

  const colliders: Rect[] = [...level.platforms, ...level.blocks];
  sortByProximity(rect, colliders);

  const movingDown = player.vy > 0.0001;
  const movingUp = player.vy < -0.0001;

  for (const r of colliders) {
    if (!aabbOverlap(rect, r)) continue;

    if (movingDown) {
      // Falling land on top
      player.y = r.y - rect.h - EPS;
      player.vy = 0;
      player.grounded = true;
      player.jumpsLeft = MAX_JUMPS;
    } else if (movingUp) {
      // Moving up  hit from below
      player.y = r.y + r.h + EPS;

      // Small downward kick to avoid sticking
      if (player.vy < 0) player.vy = 10;

      // If this collider is a block and hasn't been hit -> bump once
      if ("hit" in (r as Block)) {
        const b = r as Block;
        if (!b.hit) {
          b.hit = true;
          coinsDelta += 1; // Add coin
          hitBlocks.push(b); // track block for engine step
          audio.bump();
        }
      }
    } else {
      // Minimal push-out if overlapping but not moving vertically
      const overlapUp = rect.y + rect.h - r.y; // push up
      const overlapDown = r.y + r.h - rect.y; // push down
      if (overlapUp < overlapDown) {
        player.y -= overlapUp + EPS;
      } else {
        player.y += overlapDown + EPS;
      }
    }

    rect.y = player.y; // keep rect synced
  }

  return { coinsDelta, hitBlocks };
}
