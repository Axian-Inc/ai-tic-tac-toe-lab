type ConfettiPiece = {
  element: HTMLDivElement;
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  velocityX: number;
  velocityY: number;
  color: string;
};

const COLORS = ["#f4a261", "#2a9d8f", "#e76f51", "#264653", "#e9c46a"];

export function triggerConfetti(): void {
  if (typeof document === "undefined") {
    return;
  }

  const container = document.createElement("div");
  container.setAttribute("data-confetti", "true");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";
  document.body.appendChild(container);

  const pieces: ConfettiPiece[] = [];
  const total = 70;
  const width = window.innerWidth;

  for (let i = 0; i < total; i += 1) {
    const piece = document.createElement("div");
    const size = 6 + Math.random() * 6;
    const x = Math.random() * width;
    const y = -20 - Math.random() * 40;

    piece.style.position = "absolute";
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 0.6}px`;
    piece.style.background = COLORS[i % COLORS.length];
    piece.style.opacity = "0.9";
    piece.style.transform = "translate3d(0, 0, 0)";
    piece.style.borderRadius = "2px";

    container.appendChild(piece);

    pieces.push({
      element: piece,
      x,
      y,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      velocityX: (Math.random() - 0.5) * 2.5,
      velocityY: 2 + Math.random() * 3.5,
      color: piece.style.background,
    });
  }

  let frame = 0;
  const duration = 180;

  function tick() {
    frame += 1;

    for (const piece of pieces) {
      piece.x += piece.velocityX;
      piece.y += piece.velocityY;
      piece.rotation += piece.rotationSpeed;
      piece.element.style.transform = `translate3d(${piece.x}px, ${piece.y}px, 0) rotate(${piece.rotation}deg)`;
    }

    if (frame < duration) {
      requestAnimationFrame(tick);
    } else {
      container.remove();
    }
  }

  requestAnimationFrame(tick);
}
