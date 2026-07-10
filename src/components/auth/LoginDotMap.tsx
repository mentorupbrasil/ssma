"use client";

import { useEffect, useRef, useState } from "react";

type RoutePoint = {
  xPct: number;
  yPct: number;
  delay: number;
};

const ROUTES: { start: RoutePoint; end: RoutePoint; color: string }[] = [
  {
    start: { xPct: 0.18, yPct: 0.42, delay: 0 },
    end: { xPct: 0.38, yPct: 0.22, delay: 2 },
    color: "#2e67ff",
  },
  {
    start: { xPct: 0.38, yPct: 0.22, delay: 2 },
    end: { xPct: 0.5, yPct: 0.32, delay: 4 },
    color: "#2e67ff",
  },
  {
    start: { xPct: 0.1, yPct: 0.14, delay: 1 },
    end: { xPct: 0.28, yPct: 0.48, delay: 3 },
    color: "#0e142b",
  },
  {
    start: { xPct: 0.54, yPct: 0.18, delay: 0.5 },
    end: { xPct: 0.34, yPct: 0.48, delay: 2.5 },
    color: "#2e67ff",
  },
];

function generateDots(width: number, height: number) {
  const dots: { x: number; y: number; radius: number; opacity: number }[] = [];
  const gap = 12;
  const dotRadius = 1;

  for (let x = 0; x < width; x += gap) {
    for (let y = 0; y < height; y += gap) {
      const isInMapShape =
        (x < width * 0.25 && x > width * 0.05 && y < height * 0.4 && y > height * 0.1) ||
        (x < width * 0.25 && x > width * 0.15 && y < height * 0.8 && y > height * 0.4) ||
        (x < width * 0.45 && x > width * 0.3 && y < height * 0.35 && y > height * 0.15) ||
        (x < width * 0.5 && x > width * 0.35 && y < height * 0.65 && y > height * 0.35) ||
        (x < width * 0.7 && x > width * 0.45 && y < height * 0.5 && y > height * 0.1) ||
        (x < width * 0.8 && x > width * 0.65 && y < height * 0.8 && y > height * 0.6);

      if (isInMapShape && Math.random() > 0.3) {
        dots.push({
          x,
          y,
          radius: dotRadius,
          opacity: Math.random() * 0.45 + 0.2,
        });
      }
    }
  }

  return dots;
}

export function LoginDotMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    resizeObserver.observe(canvas.parentElement);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const maybeCtx = canvas.getContext("2d");
    if (maybeCtx === null) return;

    const ctx: CanvasRenderingContext2D = maybeCtx;

    const dots = generateDots(dimensions.width, dimensions.height);
    let animationFrameId: number;
    let startTime = Date.now();

    function drawDots() {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(15, 61, 74, ${dot.opacity})`;
        ctx.fill();
      });
    }

    function drawRoutes() {
      const currentTime = (Date.now() - startTime) / 1000;

      ROUTES.forEach((route) => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;

        const duration = 3;
        const progress = Math.min(elapsed / duration, 1);

        const startX = route.start.xPct * dimensions.width;
        const startY = route.start.yPct * dimensions.height;
        const endX = route.end.xPct * dimensions.width;
        const endY = route.end.yPct * dimensions.height;

        const x = startX + (endX - startX) * progress;
        const y = startY + (endY - startY) * progress;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = route.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(startX, startY, 3, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#2e67ff";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(22, 160, 133, 0.35)";
        ctx.fill();

        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(endX, endY, 3, 0, Math.PI * 2);
          ctx.fillStyle = route.color;
          ctx.fill();
        }
      });
    }

    function animate() {
      drawDots();
      drawRoutes();

      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 15) {
        startTime = Date.now();
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
