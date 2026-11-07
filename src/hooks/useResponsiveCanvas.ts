import { useState, useEffect } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants/game';
import { currentLayout, Layout } from '../utils/layout';

type CanvasSize = {
  width: number;
  height: number;
  scale: number;
};

export const useResponsiveCanvas = () => {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() =>
    calculateCanvasSize()
  );

  useEffect(() => {
    let timeoutId: number;
    // Phones (touch screens) resize their visual viewport when the address bar moves
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    const handleResize = () => {
      // Debounce resize events to avoid flickering
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        const newSize = calculateCanvasSize();

        // More aggressive threshold for the compact layout to prevent scroll-triggered resizes
        const threshold = currentLayout() === 'compact' ? 30 : 15;

        // Only update if size changed significantly
        setCanvasSize(prevSize => {
          if (Math.abs(prevSize.width - newSize.width) > threshold ||
              Math.abs(prevSize.height - newSize.height) > threshold) {
            return newSize;
          }
          return prevSize;
        });
      }, 150); // Increased debounce for better stability
    };

    // On mobile: ONLY listen to visualViewport to avoid address bar triggering resize
    // On desktop: listen to window.resize
    if (isTouch && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Also listen to orientation change for more reliable detection
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      if (isTouch && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return canvasSize;
};

// Cache stable height for mobile landscape to prevent scroll-induced resizes
let cachedMobileLandscapeHeight: number | null = null;

function calculateCanvasSize(): CanvasSize {
  const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

  const viewportWidth = window.innerWidth;
  const layout: Layout = currentLayout();

  // For mobile landscape, use cached height or calculate once
  // This prevents scroll-triggered size changes from address bar
  let viewportHeight: number;
  if (layout === 'compact') {
    if (cachedMobileLandscapeHeight === null) {
      // Use the larger of visualViewport or innerHeight for initial calculation
      cachedMobileLandscapeHeight = Math.max(
        window.visualViewport?.height || 0,
        window.innerHeight
      );
    }
    viewportHeight = cachedMobileLandscapeHeight;
  } else {
    // Reset cache when not in the compact layout
    cachedMobileLandscapeHeight = null;
    viewportHeight = window.visualViewport?.height || window.innerHeight;
  }

  let maxWidth: number;
  let maxHeight: number;

  if (layout === 'stacked') {
    // Mobile Portrait: controls below canvas
    maxWidth = viewportWidth - 32; // 16px padding on each side
    maxHeight = viewportHeight - 420; // Reserve space for title, controls below, instructions (reduced)
  } else if (layout === 'compact') {
    // Phone sideways: compact controls on the sides, no title
    maxWidth = viewportWidth - 232; // Two compact panels (~96 px each), gaps and padding
    maxHeight = viewportHeight - 20; // Title, instructions, and padding (minimized)
  } else {
    // Desktop: leave space for side controls (400px total), title, and padding
    maxWidth = viewportWidth - 480; // Controls + padding (reduced for larger canvas)
    maxHeight = viewportHeight - 220; // Title, instructions, and padding (reduced)
  }

  // Calculate size maintaining aspect ratio
  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  // Calculate scale factor
  const scale = width / CANVAS_WIDTH;

  return {
    width: Math.floor(width),
    height: Math.floor(height),
    scale
  };
}
