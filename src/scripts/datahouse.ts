/* The Luca "data house": a wireframe shop drawn in Three.js, the keeping place for a small business's books.
   It builds from the ground up (ground ring, floor grid, frame, walls, roof, shelves of stock, a counter with a
   cashier recording a sale on Luca, a debts board, a safe, a naira on the gable). Then its labels come in:
   an icon on every stock box, the cashier's phone, and tags for the sale, the stock, the debts and the wallet.
   The camera finally flies in through the front door. Driven from outside: set `state`, call render(). */
import * as THREE from 'three';

type Seg = [number, number, number, number, number, number];
export interface DataHouse {
  state: { build: number; rot: number; zoom: number; fade: number; labels: number };
  render(): void;
  setSize(w: number, h: number): void;
  dispose(): void;
}

const ICON: Record<string, string> = {
  naira: 'M8 18V6l8 12V6M5 10.5h14M5 13.5h14',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  chart: 'M4 20h16M7 16v-4M12 16V8M17 16V5',
  stock: 'M3 7.5 12 3l9 4.5-9 4.5-9-4.5zM3 7.5v9L12 21l9-4.5v-9M12 12v9',
  wallet: 'M4 7h14a2 2 0 0 1 2 2v9H4zM4 7l11-3v3M16 13.5h1.5',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 20c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2M16 11.2a2.6 2.6 0 1 0 0-5.2M17.5 14.9c1.9.6 3 2.3 3 5.1',
};
const NAVY = '#1E1F4B', BLUE = '#01B5EC', INK = '#0B0B0C';

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
  const cuboid = (arr: Seg[], x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    const v = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => seg(arr, v[a], v[b]));
  };
  const circle = (arr: Seg[], cx: number, cy: number, cz: number, r: number, n = 20, plane: 'xy' | 'zy' = 'xy') => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      const p = (a: number) => (plane === 'xy' ? [cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz] : [cx, cy + Math.sin(a) * r, cz + Math.cos(a) * r]);
      seg(arr, p(a0), p(a1));
    }
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
  // inside, at the back: ledger shelves, and stock on them
  const boxes: [number, number][] = [[-1.4, 0.55], [-0.95, 0.55], [0.1, 0.55], [1.2, 0.55], [-0.6, 1.1], [0.5, 1.1], [0.95, 1.1], [-1.3, 1.65], [0.2, 1.65]];
  for (const y of [0.55, 1.1, 1.65]) seg(blue, [-1.75, y, -1.15], [1.75, y, -1.15]);
  boxes.forEach(([x, y]) => cuboid(navy, x - 0.15, x + 0.15, y, y + 0.3, -1.3, -1.0));
  // inside, at the front: a counter, and a cashier behind it recording a sale
  cuboid(navy, -1.6, -0.5, 0, 0.85, 0.3, 0.72);
  const cx = -1.05, cz = 0.05;
  circle(navy, cx, 1.52, cz, 0.13);
  seg(navy, [cx, 1.39, cz], [cx, 0.95, cz]);
  seg(navy, [cx - 0.17, 1.28, cz], [cx + 0.17, 1.28, cz]);
  seg(navy, [cx - 0.17, 1.28, cz], [cx - 0.08, 1.05, cz + 0.32]);
  seg(navy, [cx + 0.17, 1.28, cz], [cx + 0.06, 1.05, cz + 0.32]);
  seg(navy, [cx, 0.95, cz], [cx - 0.1, 0, cz]); seg(navy, [cx, 0.95, cz], [cx + 0.1, 0, cz]);
  // on the right wall: the debts board; in the front corner: the safe
  loop(navy, [[W - 0.03, 0.95, -0.4], [W - 0.03, 1.9, -0.4], [W - 0.03, 1.9, 0.9], [W - 0.03, 0.95, 0.9]]);
  for (const y of [1.15, 1.35, 1.55, 1.72]) seg(blue, [W - 0.03, y, -0.3], [W - 0.03, y, 0.8]);
  cuboid(navy, 1.05, 1.5, 0, 0.45, 0.72, 1.12);
  circle(blue, 1.27, 0.23, 1.121, 0.08, 16);
  // a naira on the gable
  const zN = D + 0.002, gy = 2.72;
  seg(blue, [-0.2, gy - 0.22, zN], [-0.2, gy + 0.22, zN]);
  seg(blue, [-0.2, gy + 0.22, zN], [0.2, gy - 0.22, zN]);
  seg(blue, [0.2, gy - 0.22, zN], [0.2, gy + 0.22, zN]);
  seg(blue, [-0.32, gy - 0.05, zN], [0.32, gy - 0.05, zN]);
  seg(blue, [-0.32, gy + 0.06, zN], [0.32, gy + 0.06, zN]);

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

  // ---------- labels: drawn once onto small canvases, shown as sprites that always face the camera ----------
  const tags: THREE.Sprite[] = [];
  const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  };
  const drawIcon = (c: CanvasRenderingContext2D, name: string, x: number, y: number, size: number, color: string, lw: number) => {
    c.save(); c.translate(x - size / 2, y - size / 2); c.scale(size / 24, size / 24);
    c.strokeStyle = color; c.lineWidth = (lw * 24) / size; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(new Path2D(ICON[name])); c.restore();
  };
  const sprite = (cv: HTMLCanvasElement, worldH: number, pos: number[]) => {
    const tex = new THREE.CanvasTexture(cv);
    if ('colorSpace' in tex) (tex as any).colorSpace = (THREE as any).SRGBColorSpace;
    tex.anisotropy = 4;
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0 });
    const s = new THREE.Sprite(m);
    const w = (worldH * cv.width) / cv.height;
    s.scale.set(w, worldH, 1); s.userData.base = [w, worldH]; s.position.set(pos[0], pos[1], pos[2]); s.renderOrder = 10;
    house.add(s); tags.push(s); return s;
  };
  const label = (text: string, icon: string, pos: number[], h = 0.2) => {
    const S = 2, fs = 26 * S, HH = 52 * S, pad = 16 * S, isz = 36 * S, gap = 10 * S;
    const cv = document.createElement('canvas'); const c = cv.getContext('2d')!;
    const font = `600 ${fs}px "Archivo Variable", "Helvetica Neue", Arial, sans-serif`;
    c.font = font; const tw = Math.ceil(c.measureText(text).width);
    cv.width = pad + isz + gap + tw + pad + 4; cv.height = HH + 4;
    c.font = font; c.textBaseline = 'middle';
    rr(c, 2, 2, cv.width - 4, HH, HH / 2); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    const ix = 2 + pad + isz / 2, iy = 2 + HH / 2;
    c.beginPath(); c.arc(ix, iy, isz / 2, 0, Math.PI * 2); c.fillStyle = BLUE; c.fill();
    drawIcon(c, icon, ix, iy, isz * 0.6, '#FFFFFF', 2.4 * S);
    c.fillStyle = NAVY; c.fillText(text, 2 + pad + isz + gap, 2 + HH / 2 + 2);
    return sprite(cv, h, pos);
  };
  const chip = (icon: string, pos: number[], size = 0.17) => {
    const S = 2, DD = 64 * S; const cv = document.createElement('canvas'); cv.width = cv.height = DD; const c = cv.getContext('2d')!;
    c.beginPath(); c.arc(DD / 2, DD / 2, DD / 2 - 2, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    drawIcon(c, icon, DD / 2, DD / 2, DD * 0.56, icon === 'naira' ? BLUE : NAVY, 2.6 * S);
    return sprite(cv, size, pos);
  };
  const phone = (pos: number[], h = 0.27) => {
    const S = 2, PW = 56 * S, PH = 100 * S; const cv = document.createElement('canvas'); cv.width = PW + 4; cv.height = PH + 4; const c = cv.getContext('2d')!;
    rr(c, 2, 2, PW, PH, 12 * S); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    rr(c, 2 + 6 * S, 2 + 14 * S, PW - 12 * S, 30 * S, 6 * S); c.fillStyle = NAVY; c.fill();
    c.fillStyle = '#FFFFFF'; c.font = `700 ${14 * S}px "Archivo Variable", Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('₦10,000', 2 + PW / 2, 2 + 29 * S);
    rr(c, 2 + 6 * S, 2 + 52 * S, PW - 12 * S, 14 * S, 7 * S); c.fillStyle = BLUE; c.fill();
    c.fillStyle = '#FFFFFF'; c.font = `600 ${9 * S}px "Archivo Variable", Arial, sans-serif`; c.fillText('Sell', 2 + PW / 2, 2 + 59 * S);
    for (const y of [74, 83]) { c.fillStyle = '#E3E7EE'; c.fillRect(2 + 8 * S, 2 + y * S, PW - 16 * S, 4 * S); }
    return sprite(cv, h, pos);
  };
  // what the labels say: the stock carries its categories, the cashier's phone shows the sale, and each area is named
  const boxIcons = ['stock', 'receipt', 'naira', 'chart', 'wallet', 'people', 'stock', 'receipt', 'chart'];
  boxes.forEach(([x, y], i) => chip(boxIcons[i], [x, y + 0.15, -0.98]));
  phone([cx, 1.1, 0.4]);
  label('Sale recorded · +₦10,000', 'naira', [cx, 2.02, 0.3]);
  label('Stock · 85 products', 'stock', [-0.1, 2.42, -1.15]);
  label('Debts · ₦35,000 due', 'people', [1.8, 1.7, 0.35]);
  label('Wallet · ₦300,000', 'wallet', [1.27, 0.78, 1.15]);

  // the camera: from a three-quarter view to just in front of the door
  const far = new THREE.Vector3(5.2, 3.3, 8.8), near = new THREE.Vector3(0, 0.72, D + 0.22);
  const lookFar = new THREE.Vector3(0, 1.45, 0), lookNear = new THREE.Vector3(0, 0.72, -3);
  const pos = new THREE.Vector3(), look = new THREE.Vector3();
  const state = { build: 0, rot: 0.55, zoom: 0, fade: 1, labels: 0 };

  function render() {
    const b = Math.min(1, Math.max(0, state.build));
    N.g.setDrawRange(0, Math.floor(N.n * b) * 2);
    B.g.setDrawRange(0, Math.floor(B.n * b) * 2);
    house.rotation.y = state.rot;
    pos.lerpVectors(far, near, state.zoom); look.lerpVectors(lookFar, lookNear, state.zoom);
    camera.position.copy(pos); camera.lookAt(look);
    N.m.opacity = 0.9 * state.fade; B.m.opacity = 0.9 * state.fade;
    // labels pop in one after another; they clear early as the camera flies in
    const clear = Math.max(0, 1 - state.zoom * 2.2);
    tags.forEach((s, i) => {
      const t0 = (i / tags.length) * 0.7, k = Math.min(1, Math.max(0, (state.labels - t0) / 0.3));
      (s.material as THREE.SpriteMaterial).opacity = k * state.fade * clear;
      const [bw, bh] = s.userData.base as number[], sc = 0.82 + 0.18 * k;
      s.scale.set(bw * sc, bh * sc, 1);
    });
    renderer.render(scene, camera);
  }
  function setSize(w: number, h: number) {
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function dispose() {
    N.g.dispose(); B.g.dispose(); N.m.dispose(); B.m.dispose();
    tags.forEach((s) => { (s.material as THREE.SpriteMaterial).map?.dispose(); s.material.dispose(); });
    renderer.dispose();
  }
  return { state, render, setSize, dispose };
}
