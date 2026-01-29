import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { GameCanvasProps, RenderSurface } from "@/lib/game/types";

function GameCanvas({ canvasRef, onSurface }: GameCanvasProps) {
  const surfaceRef = useRef<RenderSurface | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const initializedRef = useRef(false); // make sure we only init once

  const attachCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas || initializedRef.current) return;

    initializedRef.current = true;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const makeOrResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);

      const pxW = Math.floor(cssW * dpr);
      const pxH = Math.floor(cssH * dpr);

      // Resize visible canvas to device pixels
      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width = pxW;
        canvas.height = pxH;
      }

      const canOffscreen = typeof OffscreenCanvas !== "undefined";

      if (!surfaceRef.current) {
        if (canOffscreen) {
          const offscreen = new OffscreenCanvas(pxW, pxH);
          const offCtx = offscreen.getContext("2d");
          if (!offCtx) return;

          surfaceRef.current = {
            dpr,
            cssW,
            cssH,
            offscreen,
            offCtx,
            present: () => {
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(offscreen as any, 0, 0);
            },
          };
        } else {
          surfaceRef.current = {
            dpr,
            cssW,
            cssH,
            offscreen: canvas,
            offCtx: ctx,
            present: () => {},
          };
        }

        onSurface(surfaceRef.current);
        return;
      }

      // Update existing surface sizes
      const s = surfaceRef.current;
      s.dpr = dpr;
      s.cssW = cssW;
      s.cssH = cssH;

      if (s.offscreen instanceof OffscreenCanvas) {
        if (s.offscreen.width !== pxW || s.offscreen.height !== pxH) {
          s.offscreen.width = pxW;
          s.offscreen.height = pxH;
        }
      }
    };

    makeOrResize();

    // Set up ResizeObserver
    roRef.current?.disconnect();
    roRef.current = new ResizeObserver(makeOrResize);
    roRef.current.observe(canvas.parentElement ?? canvas);
  };

  return (
    <canvas
      ref={(node) => {
        canvasRef.current = node;
        attachCanvas(node);
      }}
      className={cn("absolute inset-0 block h-full w-full")}
      style={{ display: "block" }}
    />
  );
}

export { GameCanvas };
