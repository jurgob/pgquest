import { useEffect, useRef, useState } from "react";

const finalMessage =
  "The PostgreSQL learning is over.\nNow you return to the road, still searching for the next challenge.\nA nerd's journey never really ends.";

export function CompletionCelebration() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visibleCharacters, setVisibleCharacters] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const drawContext = context;
    let animationFrame = 0;
    const start = performance.now();

    function draw(now: number) {
      const time = (now - start) / 1000;
      const step = Math.floor(time * 1.25) % 2;
      const armSwing = step ? 1 : 0;
      const glow = Math.round(Math.sin(time * 0.8) * 1.5);

      drawContext.imageSmoothingEnabled = false;
      drawContext.fillStyle = "#621406";
      drawContext.fillRect(0, 0, 80, 4);
      drawContext.fillStyle = "#7b1908";
      drawContext.fillRect(0, 4, 80, 4);
      drawContext.fillStyle = "#941f0a";
      drawContext.fillRect(0, 8, 80, 4);
      drawContext.fillStyle = "#ad2810";
      drawContext.fillRect(0, 12, 80, 4);
      drawContext.fillStyle = "#c7351a";
      drawContext.fillRect(0, 16, 80, 4);
      drawContext.fillStyle = "#df4826";
      drawContext.fillRect(0, 20, 80, 5);
      drawContext.fillStyle = "#e05b45";
      drawContext.fillRect(0, 25, 80, 5);

      // Sunset and distant mountains.
      const sunGradient = drawContext.createRadialGradient(
        57 - glow * 0.2,
        9 - glow * 0.2,
        1,
        60,
        12 - glow,
        7,
      );
      sunGradient.addColorStop(0, "#ffd166");
      sunGradient.addColorStop(0.55, "#f28c28");
      sunGradient.addColorStop(1, "#d9572b");
      drawContext.fillStyle = sunGradient;
      drawContext.beginPath();
      drawContext.arc(60, 12 - glow, 6.5, 0, Math.PI * 2);
      drawContext.fill();
      drawContext.fillStyle = "#41613f";
      drawContext.beginPath();
      drawContext.moveTo(0, 31);
      drawContext.lineTo(17, 23);
      drawContext.lineTo(31, 31);
      drawContext.lineTo(45, 21);
      drawContext.lineTo(65, 31);
      drawContext.lineTo(80, 25);
      drawContext.lineTo(80, 45);
      drawContext.lineTo(0, 45);
      drawContext.closePath();
      drawContext.save();
      drawContext.clip();
      const mountainGradient = drawContext.createLinearGradient(0, 22, 0, 45);
      mountainGradient.addColorStop(0, "#78a565");
      mountainGradient.addColorStop(0.4, "#527d4b");
      mountainGradient.addColorStop(1, "#294631");
      drawContext.fillStyle = mountainGradient;
      drawContext.fillRect(0, 21, 80, 24);
      const mountainShadow = drawContext.createLinearGradient(0, 0, 60, 0);
      mountainShadow.addColorStop(0, "rgba(18, 37, 25, 0.45)");
      mountainShadow.addColorStop(0.75, "rgba(18, 37, 25, 0.12)");
      mountainShadow.addColorStop(1, "rgba(18, 37, 25, 0)");
      drawContext.fillStyle = mountainShadow;
      drawContext.fillRect(0, 21, 80, 24);
      drawContext.restore();

      // The road narrows toward the sunset and darkens toward the foreground.
      drawContext.beginPath();
      drawContext.moveTo(35, 29);
      drawContext.lineTo(48, 29);
      drawContext.lineTo(78, 45);
      drawContext.lineTo(2, 45);
      drawContext.closePath();
      drawContext.save();
      drawContext.clip();
      const roadGradient = drawContext.createLinearGradient(0, 29, 0, 45);
      roadGradient.addColorStop(0, "#c99a68");
      roadGradient.addColorStop(0.55, "#a8754e");
      roadGradient.addColorStop(1, "#704936");
      drawContext.fillStyle = roadGradient;
      drawContext.fill();
      drawContext.restore();
      drawContext.fillStyle = "#5b5a38";
      drawContext.fillRect(40, 32, 3, 2);

      // A small traveler, seen from behind, walking toward the horizon.
      const baseY = 37;
      pixel(drawContext, 39, baseY - 14, 4, 4, "#fff7e6");
      pixel(drawContext, 38, baseY - 13, 6, 1, "#d62839");
      pixel(drawContext, 43, baseY - 12, 3, 1, "#d62839");
      pixel(drawContext, 38, baseY - 9, 7, 9, "#fff7e6");
      pixel(drawContext, 38, baseY - 3, 7, 2, "#171326");
      pixel(drawContext, 35, baseY - 9 + armSwing, 2, 6, "#fff7e6");
      pixel(drawContext, 46, baseY - 9 - armSwing, 2, 6, "#fff7e6");
      pixel(drawContext, 35, baseY - 3 + armSwing, 2, 2, "#171326");
      pixel(drawContext, 46, baseY - 3 - armSwing, 2, 2, "#171326");
      pixel(drawContext, 38, baseY, 3, step ? 8 : 6, "#fff7e6");
      pixel(drawContext, 42, baseY, 3, step ? 6 : 8, "#fff7e6");

      animationFrame = requestAnimationFrame(draw);
    }

    animationFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    if (visibleCharacters >= finalMessage.length) {
      return;
    }

    const timeout = window.setTimeout(
      () => setVisibleCharacters((current) => current + 1),
      visibleCharacters === 0
        ? 1000
        : finalMessage[visibleCharacters] === "\n"
          ? 700
          : 110,
    );

    return () => window.clearTimeout(timeout);
  }, [visibleCharacters]);

  return (
    <>
      <canvas
        aria-label="Pixel art traveler walking toward a sunset"
        className="mt-2 block aspect-video h-auto w-full border border-[#7f2637] bg-[#2a101f]"
        height="45"
        ref={canvasRef}
        role="img"
        width="80"
      />
      <p
        aria-live="polite"
        className="mt-6 min-h-36 whitespace-pre-line text-center font-mono text-xl font-bold uppercase leading-9 text-amber-100 [text-shadow:3px_3px_0_#2a101f] sm:text-3xl sm:leading-[3.25rem]"
      >
        {finalMessage.slice(0, visibleCharacters)}
        {visibleCharacters < finalMessage.length ? (
          <span aria-hidden="true" className="ml-1 animate-pulse text-amber-300">
            ▌
          </span>
        ) : null}
      </p>
    </>
  );
}

function pixel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}
