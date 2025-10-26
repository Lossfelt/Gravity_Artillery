import { RefObject } from 'react';

type GameCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
};

export const GameCanvas = ({ canvasRef, width, height }: GameCanvasProps) => (
  <canvas
    ref={canvasRef}
    width={width}
    height={height}
    className="border-2 border-gray-700 rounded-lg mb-6"
  />
);
