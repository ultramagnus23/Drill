// Generates an organic, lobed blob outline (deterministic, not random) to
// stand in for a brain hemisphere. Not anatomically accurate — evocative.
function blobPoints(cx: number, cy: number, rx: number, ry: number, seed: number, samples = 48): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    const wobble =
      1 +
      0.09 * Math.sin(t * 3 + seed) +
      0.06 * Math.sin(t * 5 + seed * 1.7) +
      0.04 * Math.sin(t * 8 + seed * 2.3);
    const x = cx + Math.cos(t) * rx * wobble;
    const y = cy + Math.sin(t) * ry * wobble;
    points.push([x, y]);
  }
  return points;
}

function smoothPath(points: [number, number][]): string {
  const n = points.length;
  let d = `M ${points[0][0]},${points[0][1]} `;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % n];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    d += `Q ${x0},${y0} ${mx},${my} `;
  }
  return d + "Z";
}

export function hemisphereBlobPath(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  return smoothPath(blobPoints(cx, cy, rx, ry, seed));
}
