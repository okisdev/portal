export function rgbToHex(rgb: string) {
  const [r, g, b] = rgb.match(/\d+/g)?.map(Number) ?? [];
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

export function randomColor(type: 'hex' | 'rgb' = 'hex') {
  const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

  return type === 'hex' ? color : rgbToHex(color);
}
