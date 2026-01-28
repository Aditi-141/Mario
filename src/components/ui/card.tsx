import * as React from "react"
import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn("ring-foreground/10 bg-card text-card-foreground gap-4 overflow-hidden rounded-lg py-4 text-xs/relaxed ring-1 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg group/card flex flex-col", className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "gap-1 rounded-t-lg px-4 group-data-[size=sm]/card:px-3 [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3 group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-xs/relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("rounded-b-lg px-4 group-data-[size=sm]/card:px-3 [.border-t]:pt-4 group-data-[size=sm]/card:[.border-t]:pt-3 flex items-center", className)}
      {...props}
    />
  )
}


type GameCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

function GameCanvas({ canvasRef }: GameCanvasProps) {
  const offscreenRef = React.useRef<OffscreenCanvas | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    // Create OffscreenCanvas matching the visible canvas
    offscreenRef.current = new OffscreenCanvas(canvas.width * dpr, canvas.height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderLoop = () => {
      const offCtx = offscreenRef.current?.getContext("2d");
      if (!offCtx) return;

      if(offscreenRef && offscreenRef.current && offscreenRef.current.width){
         // Example draw on offscreen canvas
        offCtx.fillStyle = "#3b82f6"; // sky blue
        offCtx.fillRect(0, 0, offscreenRef.current.width, offscreenRef.current.height);

        // Copy offscreen canvas to visible canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenRef.current, 0, 0, canvas.width, canvas.height);

      }
     

      requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }, [canvasRef]);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}


export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  GameCanvas
}
