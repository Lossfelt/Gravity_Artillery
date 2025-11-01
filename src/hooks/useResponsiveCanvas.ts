import { useState, useEffect } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants/game';

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
    const isMobile = window.innerWidth < 768;
    const isLandscape = window.innerWidth > window.innerHeight;

    const handleResize = () => {
      // Debounce resize events to avoid flickering
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        const newSize = calculateCanvasSize();

        // More aggressive threshold for mobile landscape to prevent scroll-triggered resizes
        const threshold = (isMobile && isLandscape) ? 30 : 15;

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
    if (isMobile && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Also listen to orientation change for more reliable detection
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      if (isMobile && window.visualViewport) {
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

  // Get viewport dimensions with some padding
  const viewportWidth = window.innerWidth;
  const isMobile = viewportWidth < 768;
  const isLandscape = viewportWidth > window.innerHeight;

  // For mobile landscape, use cached height or calculate once
  // This prevents scroll-triggered size changes from address bar
  let viewportHeight: number;
  if (isMobile && isLandscape) {
    if (cachedMobileLandscapeHeight === null) {
      // Use the larger of visualViewport or innerHeight for initial calculation
      cachedMobileLandscapeHeight = Math.max(
        window.visualViewport?.height || 0,
        window.innerHeight
      );
    }
    viewportHeight = cachedMobileLandscapeHeight;
  } else {
    // Reset cache when not in mobile landscape
    cachedMobileLandscapeHeight = null;
    viewportHeight = window.visualViewport?.height || window.innerHeight;
  }

  let maxWidth: number;
  let maxHeight: number;

  // Use the already calculated isMobile and isLandscape values
  if (isMobile && !isLandscape) {
    // Mobile Portrait: controls below canvas
    maxWidth = viewportWidth - 32; // 16px padding on each side
    maxHeight = viewportHeight - 420; // Reserve space for title, controls below, instructions (reduced)
  } else if (isMobile && isLandscape) {
    // Mobile Landscape: controls on sides (compact)
    // Minimize reserved space for maximum canvas size
    maxWidth = viewportWidth - 200; // Controls + padding + gaps (minimized for larger canvas)
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
