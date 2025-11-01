import { RefObject } from 'react';

type GameCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
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
      className="border-2 border-gray-700 rounded-lg mb-6"
    />
  );
};
