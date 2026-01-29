import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { GameCanvasProps, RenderSurface } from "@/lib/game/types";

/* ... keep Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter unchanged ... */

function GameCanvas({ canvasRef, onSurface }: GameCanvasProps) {
  const surfaceRef = useRef<RenderSurface | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

      // Prefer OffscreenCanvas if supported, fallback to onscreen canvas
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
              // Present offscreen -> visible in device pixel space
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              // drawImage supports OffscreenCanvas in modern browsers
              ctx.drawImage(offscreen as any, 0, 0);
            },
          };
        } else {
          // Fallback: render directly on visible canvas (no blit)
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

      // Update existing surface sizes if needed
      const s = surfaceRef.current;
      s.dpr = dpr;
      s.cssW = cssW;
      s.cssH = cssH;

      if (s.offscreen instanceof OffscreenCanvas) {
        if (s.offscreen.width !== pxW || s.offscreen.height !== pxH) {
          s.offscreen.width = pxW;
          s.offscreen.height = pxH;
        }
      } else {
        // onscreen fallback already resized above
      }
    };

    makeOrResize();

    // ResizeObserver keeps canvas correct as card changes size
    roRef.current?.disconnect();
    roRef.current = new ResizeObserver(() => makeOrResize());
    roRef.current.observe(canvas.parentElement ?? canvas);

    return () => {
      roRef.current?.disconnect();
      roRef.current = null;
      surfaceRef.current = null;
      onSurface(null);
    };
  }, [canvasRef, onSurface]);

  // IMPORTANT: canvas should fill parent; engine controls all drawing
  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 block h-full w-full")}
      style={{ display: "block" }}
    />
  );
}

export {
  /* your card exports unchanged */
  GameCanvas,
};
