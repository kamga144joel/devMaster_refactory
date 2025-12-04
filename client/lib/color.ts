export function hexToHslTriple(hex: string): string {
  let r = 0, g = 0, b = 0;
  const m = hex.replace('#','');
  if (m.length === 3) {
    r = parseInt(m[0]+m[0], 16);
    g = parseInt(m[1]+m[1], 16);
    b = parseInt(m[2]+m[2], 16);
  } else if (m.length >= 6) {
    r = parseInt(m.slice(0,2), 16);
    g = parseInt(m.slice(2,4), 16);
    b = parseInt(m.slice(4,6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`;
}
