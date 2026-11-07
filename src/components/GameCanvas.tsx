import { RefObject } from 'react';

type GameCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  displayWidth?: number;
  displayHeight?: number;
};

export const GameCanvas = ({
  canvasRef,
  width,
  height,
  displayWidth,
  displayHeight
}: GameCanvasProps) => {
  const style = displayWidth && displayHeight
    ? { width: `${displayWidth}px`, height: `${displayHeight}px` }
    : undefined;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={style}
      className="border border-white/10 rounded-lg mb-6 shadow-[0_0_40px_-12px_rgba(120,140,255,0.45)]"
    />
  );
};
