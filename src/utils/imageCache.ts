// Images shared by everything that draws outside the main canvas loop, loaded once
const cache = new Map<string, Promise<HTMLImageElement>>();

export const loadImageOnce = (src: string): Promise<HTMLImageElement> => {
  let promise = cache.get(src);
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    cache.set(src, promise);
  }
  return promise;
};
