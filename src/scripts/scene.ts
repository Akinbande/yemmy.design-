/**
 * The system scene.
 *
 * One InstancedMesh of 160 card-like tiles moves through three states as the
 * reader scrolls:
 *   A  scattered fragments      (research: unresolved)
 *   B  four exploded layers     (architecture: structure appears)
 *   C  a single 16 x 10 screen  (interface: it resolves, a selection frame draws)
 * Progress 0..1 is driven from outside (ScrollTrigger, or a slider in /lab/scene).
 */
import * as THREE from 'three';

export interface SceneHandle {
  setProgress(p: number): void;
  setActive(active: boolean): void;
  destroy(): void;
}

const COLS = 16, ROWS = 10, N = COLS * ROWS;
const TILE_W = 0.5, TILE_H = 0.31, TILE_D = 0.035;

const seeded = (x: number) => { const s = Math.sin(x * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number };

function buildStates() {
  const A: Pose[] = [], B: Pose[] = [], C: Pose[] = [];
  for (let i = 0; i < N; i++) {
    // A: a loose 3D grid with jitter, biased right so the hero copy stays clear.
    //    Reads as something designed coming apart, not as random debris.
    const gx = i % 8, gy = Math.floor(i / 8) % 5, gz = Math.floor(i / 40);
    const jit = (k: number) => (seeded(i * k) - 0.5);
    A.push({
      x: (gx - 3.5) * 0.98 + jit(1.1) * 0.7 + 2.1,
      y: (gy - 2) * 0.82 + jit(2.3) * 0.6 + (gz - 1.5) * 0.18,
      z: (gz - 1.5) * 1.9 + jit(3.7) * 1.2,
      rx: jit(4.1) * 0.9,
      ry: jit(5.3) * 1.1,
      rz: jit(6.7) * 0.5,
    });
    // B: four exploded layers of 8 x 5
    const L = Math.floor(i / 40), j = i % 40, bx = j % 8, by = Math.floor(j / 8);
    B.push({
      x: (bx - 3.5) * 0.66 + (L - 1.5) * 0.22 + 0.9,
      y: (by - 2) * 0.46 + (L - 1.5) * 0.12,
      z: (L - 1.5) * 1.75,
      rx: 0, ry: 0, rz: 0,
    });
    // C: one screen, 16 x 10
    const cx = i % COLS, cy = Math.floor(i / COLS);
    C.push({
      x: (cx - (COLS - 1) / 2) * 0.54 * 0.92,
      y: ((ROWS - 1) / 2 - cy) * 0.35 * 0.92,
      z: 0, rx: 0, ry: 0, rz: 0,
    });
  }
  return { A, B, C };
}

export function initScene(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean }): SceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0, 11.5);

  scene.add(new THREE.HemisphereLight(0xebeef5, 0x09090a, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6190ff, 1.3); rim.position.set(-6, -3, -5); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x6190ff, 0.35); fill.position.set(0, -4, 6); scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  const geo = new THREE.BoxGeometry(TILE_W, TILE_H, TILE_D);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.48, metalness: 0.38 });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(mesh);

  const cDark = new THREE.Color('#1B1C21'), cMid = new THREE.Color('#2C2E34'), cBrand = new THREE.Color('#6190FF');
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = seeded(i * 7.13);
    (r < 0.09 ? cBrand : r < 0.52 ? cMid : cDark).toArray(col, i * 3);
  }
  mesh.instanceColor = new THREE.InstancedBufferAttribute(col, 3);

  // selection frame around the resolved screen
  const hw = (COLS / 2) * 0.54 * 0.92 + 0.22, hh = (ROWS / 2) * 0.35 * 0.92 + 0.22;
  const frameMat = new THREE.LineBasicMaterial({ color: 0x6190ff, transparent: true, opacity: 0 });
  const frameGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-hw, -hh, 0.05), new THREE.Vector3(hw, -hh, 0.05),
    new THREE.Vector3(hw, hh, 0.05), new THREE.Vector3(-hw, hh, 0.05), new THREE.Vector3(-hw, -hh, 0.05),
  ]);
  const frame = new THREE.Line(frameGeo, frameMat);
  group.add(frame);
  const handleMat = new THREE.MeshBasicMaterial({ color: 0x6190ff, transparent: true, opacity: 0 });
  const handleInner = new THREE.MeshBasicMaterial({ color: 0x09090a, transparent: true, opacity: 0 });
  const handleGeo = new THREE.PlaneGeometry(0.2, 0.2), handleGeoIn = new THREE.PlaneGeometry(0.12, 0.12);
  const handles: THREE.Mesh[] = [];
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const h = new THREE.Mesh(handleGeo, handleMat); h.position.set(sx * hw, sy * hh, 0.06);
    const hi = new THREE.Mesh(handleGeoIn, handleInner); hi.position.set(sx * hw, sy * hh, 0.07);
    group.add(h, hi); handles.push(h, hi);
  }

  const { A, B, C } = buildStates();
  const rotA = { x: 0.18, y: -0.32, z: 0.03 }, rotB = { x: -0.46, y: 0.58, z: 0.06 }, rotC = { x: 0, y: 0, z: 0 };
  const dummy = new THREE.Object3D();

  let progress = 0, active = true, raf = 0;

  function apply(p: number, t: number) {
    const sA = smooth(0, 0.42, p), sB = smooth(0.46, 0.8, p);
    const breathe = opts.reducedMotion ? 0 : (1 - sA) * 0.05;
    group.rotation.set(
      lerp(lerp(rotA.x, rotB.x, sA), rotC.x, sB) + Math.sin(t * 0.22) * breathe,
      lerp(lerp(rotA.y, rotB.y, sA), rotC.y, sB) + Math.cos(t * 0.17) * breathe,
      lerp(lerp(rotA.z, rotB.z, sA), rotC.z, sB),
    );
    group.position.x = lerp(0, -0.2, sB);
    camera.position.z = lerp(lerp(11.5, 12.8, sA), 11.2, sB);

    for (let i = 0; i < N; i++) {
      const st = (seeded(i * 9.7) - 0.5) * 0.14;           // per-tile stagger
      const a = smooth(0, 0.42, p + st), b = smooth(0.46, 0.8, p + st * 0.6);
      const pa = A[i], pb = B[i], pc = C[i];
      const drift = (1 - a) * (opts.reducedMotion ? 0 : 1);
      const dx = Math.sin(t * 0.32 + i * 0.37) * 0.07 * drift;
      const dy = Math.cos(t * 0.27 + i * 0.61) * 0.09 * drift;
      dummy.position.set(
        lerp(lerp(pa.x, pb.x, a), pc.x, b) + dx,
        lerp(lerp(pa.y, pb.y, a), pc.y, b) + dy,
        lerp(lerp(pa.z, pb.z, a), pc.z, b),
      );
      dummy.rotation.set(
        lerp(lerp(pa.rx, pb.rx, a), pc.rx, b) + Math.sin(t * 0.25 + i) * 0.05 * drift,
        lerp(lerp(pa.ry, pb.ry, a), pc.ry, b) + Math.cos(t * 0.21 + i * 0.5) * 0.05 * drift,
        lerp(lerp(pa.rz, pb.rz, a), pc.rz, b),
      );
      const s = lerp(lerp(0.86, 1, a), 1, b);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    const f = smooth(0.8, 0.9, p);
    frameMat.opacity = f; handleMat.opacity = f; handleInner.opacity = f;
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(() => { resize(); if (opts.reducedMotion) renderOnce(); });
  ro.observe(canvas);
  resize();

  function renderOnce() { apply(progress, 0); renderer.render(scene, camera); }
  function frameLoop(now: number) {
    if (!active) return;
    apply(progress, now / 1000);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frameLoop);
  }

  if (opts.reducedMotion) { progress = 0.86; renderOnce(); }
  else raf = requestAnimationFrame(frameLoop);

  return {
    setProgress(p) { progress = Math.min(1, Math.max(0, p)); if (opts.reducedMotion) renderOnce(); },
    setActive(a) {
      if (opts.reducedMotion) return;
      if (a && !active) { active = true; raf = requestAnimationFrame(frameLoop); }
      else if (!a && active) { active = false; cancelAnimationFrame(raf); }
    },
    destroy() {
      active = false; cancelAnimationFrame(raf); ro.disconnect();
      geo.dispose(); mat.dispose(); frameGeo.dispose(); frameMat.dispose();
      handleGeo.dispose(); handleGeoIn.dispose(); handleMat.dispose(); handleInner.dispose();
      renderer.dispose();
    },
  };
}
