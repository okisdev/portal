export function rgbToHex(rgb: string) {
  const [r, g, b] = rgb.match(/\d+/g)?.map(Number) ?? [];
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

// Convert hex to RGB
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
}

// Calculate relative luminance
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const normalized = c / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Determine if white or black text should be used based on background color
export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000'; // Default to black if invalid color

  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Adjust color brightness
export function adjustColorBrightness(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const r = Math.max(0, Math.min(255, rgb.r + amount));
  const g = Math.max(0, Math.min(255, rgb.g + amount));
  const b = Math.max(0, Math.min(255, rgb.b + amount));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function randomColor(type: 'hex' | 'rgb' = 'hex') {
  const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

  return type === 'hex' ? color : rgbToHex(color);
}
