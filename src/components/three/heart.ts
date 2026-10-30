import * as THREE from "three";

/** Classic bezier heart outline (points down after the flip in heartGeometry). */
export function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(2.5, 2.5);
  s.bezierCurveTo(2.5, 2.5, 2.0, 0, 0, 0);
  s.bezierCurveTo(-3, 0, -3, 3.5, -3, 3.5);
  s.bezierCurveTo(-3, 5.5, -1, 7.7, 2.5, 9.5);
  s.bezierCurveTo(6, 7.7, 8, 5.5, 8, 3.5);
  s.bezierCurveTo(8, 3.5, 8, 0, 5, 0);
  s.bezierCurveTo(3.5, 0, 2.5, 2.5, 2.5, 2.5);
  return s;
}

export function heartGeometry(
  scale: number,
  opts: { holes?: THREE.Path[]; depth?: number; bevel?: number; curveSegments?: number } = {},
) {
  const shape = heartShape();
  if (opts.holes) shape.holes.push(...opts.holes);
  const bevel = opts.bevel ?? 1.1;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: opts.depth ?? 2,
    bevelEnabled: true,
    bevelSegments: 6,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: opts.curveSegments ?? 24,
  });
  geo.center();
  geo.rotateZ(Math.PI);
  geo.scale(scale, scale, scale);
  return geo;
}

/** Parametric heart (x,y in ~[-1,1]) — used to sample particle positions. */
export function heartPoint(t: number) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [x / 17, (y + 2) / 17] as const;
}
