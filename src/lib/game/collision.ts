import type { Player, Rect, Level } from "./types";
import { aabbOverlap } from "./math";
import { MAX_JUMPS } from "./constants";

/**
 * It handles horizontal collision resolution for the player gravity, landing on platforms, bonking your head on blocks, resetting jumps, and triggering bump sounds.
 * @param player Position, velocity, jumps, grounded state
 * @param level contains platforms and blocks
 */
export function resolveX(player: Player, level: Level) {
  const rect: Rect = { x: player.x, y: player.y, w: player.w, h: player.h };

  /**
   * This function checks for collision
   * @param rects this check for cosrdinates
   * @param resetVel this is a boolean value for resetting value
   */
  const checkCollisions = (rects: Rect[], resetVel = true) => {
    for (const r of rects) {
      if (!aabbOverlap(rect, r)) continue;
      const fromLeft = rect.x + rect.w / 2 < r.x + r.w / 2;
      player.x = fromLeft ? r.x - player.w - 0.01 : r.x + r.w + 0.01;
      if (resetVel) player.vx = 0;
      rect.x = player.x;
    }
  };

  checkCollisions(level.platforms);
  
  checkCollisions(level.blocks);
}

/**
 * It handles vertical collision resolution for the player — gravity, landing on platforms, bonking your head on blocks, resetting jumps, and triggering bump sounds.
 * @param player position, velocity, jumps, grounded state
 * @param level contains platforms and blocks
 * @param audio used to play a bump sound
 */
export function resolveY(player: Player, level: Level, audio: any, hudCoins:number) {
  player.grounded = false;
  const rect: Rect = { x: player.x, y: player.y, w: player.w, h: player.h };

  const resolve = (rects: Rect[], headHits = false) => {
    for (const r of rects) {
      if (!aabbOverlap(rect, r)) continue;
      const fromAbove = rect.y + rect.h / 2 < r.y + r.h / 2;
      if (fromAbove) {
        player.y = r.y - player.h - 0.01;
        player.vy = 0;
        player.grounded = true;
        player.jumpsLeft = MAX_JUMPS;
      } else {
        player.y = r.y + r.h + 0.01;
        if (player.vy < 0) player.vy = 80;
        if (headHits && "hit" in r) {
          r.hit = true;
          audio.bump();
          hudCoins++;
        }
      }
      rect.y = player.y;
    }
  };

  resolve(level.platforms);
  resolve(level.blocks, true);
}
