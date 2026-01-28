import type { Block, Coin, Player, Rect } from "./types";

/**
 * This function draws clouds
 * @param ctx This is the 2D rendering context for a <canvas> element.
 * @param x  x Coordinates on the canvas.
 * @param y y Coordinates on the canvas.
 */
export const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.arc(x + 20, y - 8, 22, 0, Math.PI * 2);
  ctx.arc(x + 44, y, 18, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
};

/**
 * This function helps to draw platform
 * @param ctx This is the 2D rendering context for a <canvas> element.
 * @param plat co-ordinates in the canvas
 */
export const drawPlatform = (ctx: CanvasRenderingContext2D, plat: Rect) => {
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

/**
 * This function helps to draw point blocks
 * @param ctx This is the 2D rendering context for a <canvas> element.
 * @param b This parameter indicates object position and hit counts
 */
export const drawBlock = (ctx: CanvasRenderingContext2D, b:Block) => {
  ctx.fillStyle = b.hit ? "#a3a3a3" : "#f59e0b";
  ctx.fillRect(b.x, b.y, b.w, b.h);

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 22px system-ui";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(b.hit ? "!" : "?", b.x + b.w / 2, b.y + b.h / 2 + 1);
};

/**
 * This function helps to draw coin in Ui
 * @param ctx This is the 2D rendering context for a <canvas> element.
 * @param c This indicates corrnates for object
 */
export const drawCoin = (ctx: CanvasRenderingContext2D, c: Coin) => {
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

/**
 * This function helps to draw the mario character
 * @param ctx This is the 2D rendering context for a <canvas> element.
 * @param p This parameter gives attributes to player
 */
export const drawMario = (ctx: CanvasRenderingContext2D, p: Player) => {
  const { x, y, w, h, facing } = p;
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

  ctx.restore();
};
