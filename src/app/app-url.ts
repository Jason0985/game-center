// Absolute URL innerhalb der App, auch unter /game-center/ (GitHub Pages); path ohne führenden "/"
export function appUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}
