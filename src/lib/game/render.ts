import type { Player, Rect, Block, Coin, Enemy } from "./types";

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

// --- NEW: Pipe drawing (pure render, collision stays the same) ---
export const drawPipe = (ctx: Ctx, r: Rect) => {
  // pipe should stand on its bottom (like mario)
  const x = r.x;
  const y = r.y;
  const w = r.w;
  const h = r.h;

  // Colors
  const GREEN = "#16a34a";
  const GREEN_D = "#0f7a35";
  const GREEN_D2 = "#0b5a28";
  const HILITE = "#86efac";
  const OUTLINE = "rgba(0,0,0,0.35)";

  // Cap sizes
  const capH = Math.max(10, Math.floor(h * 0.32));
  const lip = Math.max(3, Math.floor(w * 0.12));
  const innerW = Math.max(4, w - lip * 2);

  // Body
  ctx.fillStyle = GREEN;
  ctx.fillRect(x, y + capH - 2, w, h - (capH - 2));

  // Body shading: left highlight + right shadow
  ctx.fillStyle = HILITE;
  ctx.fillRect(x + Math.floor(w * 0.15), y + capH, Math.floor(w * 0.12), h - capH);

  ctx.fillStyle = GREEN_D2;
  ctx.fillRect(x + Math.floor(w * 0.72), y + capH, Math.floor(w * 0.18), h - capH);

  // Cap (top)
  ctx.fillStyle = GREEN_D;
  ctx.fillRect(x - lip, y, w + lip * 2, capH);

  // Cap inner darker strip
  ctx.fillStyle = GREEN_D2;
  ctx.fillRect(x - lip + 2, y + 2, w + lip * 2 - 4, Math.max(3, capH - 6));

  // Mouth opening (a darker hole)
  ctx.fillStyle = "#064e3b";
  ctx.fillRect(x + lip, y + Math.floor(capH * 0.35), innerW, Math.max(4, Math.floor(capH * 0.35)));

  // Outline (subtle)
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - lip + 1, y + 1, w + lip * 2 - 2, capH - 2);
  ctx.strokeRect(x + 1, y + capH - 1, w - 2, h - capH);
};

export const drawCloud = (ctx: Ctx, x: number, y: number) => {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.arc(x + 20, y - 8, 22, 0, Math.PI * 2);
  ctx.arc(x + 44, y, 18, 0, Math.PI * 2);
  ctx.fill();
};

export const drawPlatform = (ctx: Ctx, plat: Rect) => {
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
};

export const drawBlock = (ctx: Ctx, b: Block) => {
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
};

export const drawCoin = (ctx: Ctx, c: Coin) => {
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
};

export const drawMario = (ctx: Ctx, p: Player) => {
  const { x, y, w, h, facing, grounded } = p;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(facing, 1);
  ctx.translate(-(x + w / 2), -(y + h / 2));

  const bob = grounded ? 0 : 1;

  const RED = "#dc2626";
  const RED_DARK = "#b91c1c";
  const BLUE = "#1d4ed8";
  const BLUE_DARK = "#1e40af";
  const SKIN = "#f5c9a6";
  const BROWN = "#7c2d12";
  const BLACK = "#111827";
  const WHITE = "#f8fafc";
  const YELLOW = "#facc15";

  const px = (n: number) => (n / 34) * w;
  const py = (n: number) => (n / 44) * h;

  ctx.fillStyle = BLACK;
  ctx.fillRect(x + px(4), y + h - py(9) + bob, px(12), py(7));
  ctx.fillRect(x + w - px(16), y + h - py(9) + bob, px(12), py(7));

  ctx.fillStyle = BLUE;
  ctx.fillRect(x + px(6), y + py(20) + bob, w - px(12), py(20));

  ctx.fillStyle = BLUE_DARK;
  ctx.fillRect(x + px(10), y + py(18) + bob, px(4), py(10));
  ctx.fillRect(x + w - px(14), y + py(18) + bob, px(4), py(10));

  ctx.fillStyle = YELLOW;
  ctx.fillRect(x + px(11), y + py(26) + bob, px(2.5), px(2.5));
  ctx.fillRect(x + w - px(13.5), y + py(26) + bob, px(2.5), px(2.5));

  ctx.fillStyle = RED;
  ctx.fillRect(x + px(6), y + py(14) + bob, w - px(12), py(12));

  ctx.fillStyle = WHITE;
  ctx.fillRect(x + px(2), y + py(24) + bob, px(6), py(6));
  ctx.fillRect(x + w - px(8), y + py(24) + bob, px(6), py(6));

  ctx.fillStyle = SKIN;
  ctx.fillRect(x + px(9), y + py(6) + bob, w - px(18), py(16));

  ctx.fillStyle = RED_DARK;
  ctx.fillRect(x + px(7), y + py(1) + bob, w - px(14), py(8));
  ctx.fillRect(x + px(6), y + py(7) + bob, w - px(12), py(3));

  ctx.fillStyle = BROWN;
  ctx.fillRect(x + px(12), y + py(16) + bob, px(12), py(3));

  ctx.fillStyle = BLACK;
  ctx.fillRect(x + px(22), y + py(10) + bob, px(3), px(3));

  ctx.restore();
};

export const drawVillain = (ctx: Ctx, e: Enemy) => {
  const { x, y, w, h, facing, alive } = e;

  ctx.save();
  ctx.globalAlpha = alive ? 1 : 0.35;

  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(facing, 1);
  ctx.translate(-(x + w / 2), -(y + h / 2));

  const BROWN = "#7c2d12";
  const BROWN_D = "#5b1f0d";
  const BLACK = "#111827";
  const WHITE = "#f8fafc";

  ctx.fillStyle = BROWN;
  ctx.fillRect(x + 2, y + 6, w - 4, h - 10);

  ctx.fillStyle = BROWN_D;
  ctx.fillRect(x + 2, y + 6, w - 4, 6);

  ctx.fillStyle = WHITE;
  ctx.fillRect(x + 6, y + 16, 6, 6);
  ctx.fillRect(x + w - 12, y + 16, 6, 6);

  ctx.fillStyle = BLACK;
  ctx.fillRect(x + 8, y + 18, 2, 2);
  ctx.fillRect(x + w - 10, y + 18, 2, 2);

  ctx.fillRect(x + 5, y + 13, 10, 2);
  ctx.fillRect(x + w - 15, y + 13, 10, 2);

  ctx.fillRect(x + 10, y + 26, w - 20, 3);

  ctx.fillRect(x + 4, y + h - 5, 10, 4);
  ctx.fillRect(x + w - 14, y + h - 5, 10, 4);

  ctx.restore();
};
