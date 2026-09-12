/* The Luca "data house": a wireframe house drawn in Three.js, the keeping place for a shop's books.
   It builds from the ground up (ground ring, floor grid, frame, walls, roof, shelves of stock, a naira on the
   gable), turns to face the camera, and the camera flies in through the front door.
   Driven from outside: set `state` and call render(). Lines only, in Luca navy and blue, on a transparent canvas. */
import * as THREE from 'three';

type Seg = [number, number, number, number, number, number];
export interface DataHouse {
  state: { build: number; rot: number; zoom: number; fade: number };
  render(): void;
  setSize(w: number, h: number): void;
  dispose(): void;
}

export function createDataHouse(canvas: HTMLCanvasElement): DataHouse {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 100);
  const house = new THREE.Group();
  scene.add(house);

  const navy: Seg[] = [], blue: Seg[] = [];
  const seg = (arr: Seg[], a: number[], b: number[]) => { arr.push([a[0], a[1], a[2], b[0], b[1], b[2]]); };
  const loop = (arr: Seg[], pts: number[][]) => pts.forEach((p, i) => seg(arr, p, pts[(i + 1) % pts.length]));
  const box = (arr: Seg[], cx: number, y: number, cz: number, s: number) => {
    const h = s / 2;
    const v = [[-h, 0, -h], [h, 0, -h], [h, 0, h], [-h, 0, h], [-h, s, -h], [h, s, -h], [h, s, h], [-h, s, h]].map(([x, yy, z]) => [cx + x, y + yy, cz + z]);
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => seg(arr, v[a], v[b]));
  };

  const W = 2, D = 1.5, H = 2.2, R = 3.35;
  // where the orbit lands: a ground ring and a floor grid
  for (let i = 0; i < 72; i++) {
    const a0 = (i / 72) * Math.PI * 2, a1 = ((i + 1) / 72) * Math.PI * 2;
    seg(blue, [Math.cos(a0) * 3.3, 0, Math.sin(a0) * 3.3], [Math.cos(a1) * 3.3, 0, Math.sin(a1) * 3.3]);
  }
  for (let x = -W; x <= W + 1e-6; x += 1) seg(blue, [x, 0, -D], [x, 0, D]);
  for (let z = -D; z <= D + 1e-6; z += 0.75) seg(blue, [-W, 0, z], [W, 0, z]);
  // the frame: sill and top plates, corner posts and studs (none where the door goes)
  loop(navy, [[-W, 0, -D], [W, 0, -D], [W, 0, D], [-W, 0, D]]);
  loop(navy, [[-W, H, -D], [W, H, -D], [W, H, D], [-W, H, D]]);
  for (const x of [-W, -1, 1, W]) for (const z of [-D, D]) seg(navy, [x, 0, z], [x, H, z]);
  seg(navy, [0, 0, -D], [0, H, -D]);
  for (const z of [-0.75, 0, 0.75]) for (const x of [-W, W]) seg(navy, [x, 0, z], [x, H, z]);
  // the roof: ridge front to back, rafters, purlins; the front rafters make the gable
  seg(navy, [0, R, -D], [0, R, D]);
  for (const z of [-D, -0.75, 0, 0.75, D]) { seg(navy, [-W, H, z], [0, R, z]); seg(navy, [W, H, z], [0, R, z]); }
  for (const s of [-1, 1]) seg(navy, [(s * W) / 2, (H + R) / 2, -D], [(s * W) / 2, (H + R) / 2, D]);
  // the front: a door and two windows
  loop(navy, [[-0.42, 0, D], [-0.42, 1.3, D], [0.42, 1.3, D], [0.42, 0, D]]);
  for (const cx of [-1.45, 1.45]) {
    loop(navy, [[cx - 0.28, 1.05, D], [cx + 0.28, 1.05, D], [cx + 0.28, 1.6, D], [cx - 0.28, 1.6, D]]);
    seg(navy, [cx, 1.05, D], [cx, 1.6, D]);
    seg(navy, [cx - 0.28, 1.325, D], [cx + 0.28, 1.325, D]);
  }
  // inside: ledger shelves along the back wall, and stock on them
  for (const y of [0.55, 1.1, 1.65]) seg(blue, [-1.75, y, -1.15], [1.75, y, -1.15]);
  [[-1.4, 0.55], [-0.95, 0.55], [0.1, 0.55], [1.2, 0.55], [-0.6, 1.1], [0.5, 1.1], [0.95, 1.1], [-1.3, 1.65], [0.2, 1.65]]
    .forEach(([x, y]) => box(navy, x, y, -1.15, 0.3));
  // a naira on the gable
  const zN = D + 0.002, cy = 2.72;
  seg(blue, [-0.2, cy - 0.22, zN], [-0.2, cy + 0.22, zN]);
  seg(blue, [-0.2, cy + 0.22, zN], [0.2, cy - 0.22, zN]);
  seg(blue, [0.2, cy - 0.22, zN], [0.2, cy + 0.22, zN]);
  seg(blue, [-0.32, cy - 0.05, zN], [0.32, cy - 0.05, zN]);
  seg(blue, [-0.32, cy + 0.06, zN], [0.32, cy + 0.06, zN]);

  // build from the ground up: sort every set by its lowest point
  const make = (arr: Seg[], color: number) => {
    arr.sort((a, b) => Math.min(a[1], a[4]) - Math.min(b[1], b[4]));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr.flat(), 3));
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
    house.add(new THREE.LineSegments(g, m));
    return { g, m, n: arr.length };
  };
  const N = make(navy, 0x1e1f4b), B = make(blue, 0x01b5ec);

  // the camera: from a three-quarter view to just in front of the door
  const far = new THREE.Vector3(5.2, 3.3, 8.8), near = new THREE.Vector3(0, 0.72, D + 0.22);
  const lookFar = new THREE.Vector3(0, 1.45, 0), lookNear = new THREE.Vector3(0, 0.72, -3);
  const pos = new THREE.Vector3(), look = new THREE.Vector3();
  const state = { build: 0, rot: 0.55, zoom: 0, fade: 1 };

  function render() {
    const b = Math.min(1, Math.max(0, state.build));
    N.g.setDrawRange(0, Math.floor(N.n * b) * 2);
    B.g.setDrawRange(0, Math.floor(B.n * b) * 2);
    house.rotation.y = state.rot;
    pos.lerpVectors(far, near, state.zoom); look.lerpVectors(lookFar, lookNear, state.zoom);
    camera.position.copy(pos); camera.lookAt(look);
    N.m.opacity = 0.9 * state.fade; B.m.opacity = 0.9 * state.fade;
    renderer.render(scene, camera);
  }
  function setSize(w: number, h: number) {
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function dispose() { N.g.dispose(); B.g.dispose(); N.m.dispose(); B.m.dispose(); renderer.dispose(); }
  return { state, render, setSize, dispose };
}
