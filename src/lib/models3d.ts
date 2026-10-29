import {
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/*
 * 첫 화면 오브젝트 모음 — 말랑한 점토·유광·벨벳·반투명 유리 질감의 추상 오브젝트.
 * 모두 지름 약 1 크기, 원점이 중심이다.
 */

export type ModelKind =
  | "swirl" // 꼬인 주름 볼
  | "knobCube" // 돌기 달린 큐브
  | "cross" // 끝이 볼록한 십자
  | "bundle" // 원통 묶음
  | "fuzzRings" // 보송한 링 탑
  | "zigzag" // 지그재그 리본
  | "glassDonut"; // 반투명 도넛

export interface ModelDef {
  kind: ModelKind;
  color: string;
  /** 쉴 때 각도 (라디안) — 3/4 각도로 보이게 */
  rest: [number, number, number];
}

// ── 재질 ────────────────────────────────────────────────
const tint = (hex: string, toWhite: number) =>
  new Color(hex).lerp(new Color("#ffffff"), toWhite);

/** 점토처럼 말랑한 무광 */
const clay = (hex: string) =>
  new MeshPhysicalMaterial({
    color: new Color(hex),
    roughness: 0.5,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
  });

/** 매끈한 유광 */
const gloss = (hex: string) =>
  new MeshPhysicalMaterial({
    color: new Color(hex),
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });

/**
 * 반투명 유리 — 실제 굴절(transmission) 대신 반투명+반사로 흉내내서
 * 장면을 두 번 그리지 않게 한다
 */
const glass = (hex: string) =>
  new MeshPhysicalMaterial({
    color: tint(hex, 0.25),
    transparent: true,
    opacity: 0.62,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    depthWrite: false,
  });

/** 잔털 느낌용 노이즈 */
let fuzzMap: CanvasTexture | null = null;
function fuzzTexture() {
  if (fuzzMap) return fuzzMap;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(256, 256);
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + rand() * 145;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  fuzzMap = new CanvasTexture(c);
  fuzzMap.wrapS = fuzzMap.wrapT = RepeatWrapping;
  fuzzMap.repeat.set(10, 4);
  return fuzzMap;
}

/** 보송한 벨벳 */
const velvet = (hex: string) =>
  new MeshPhysicalMaterial({
    color: new Color(hex),
    roughness: 1,
    sheen: 1,
    sheenRoughness: 0.25,
    sheenColor: tint(hex, 0.85),
    bumpMap: fuzzTexture(),
    bumpScale: 6,
  });

// ── 모양 ────────────────────────────────────────────────
function mesh(geo: BufferGeometry, mat: MeshPhysicalMaterial) {
  return new Mesh(geo, mat);
}

/** 꼬인 주름 볼: 구 표면을 나선 방향으로 물결치게 */
function swirl(hex: string) {
  const geo = new SphereGeometry(0.42, 112, 72);
  const p = geo.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const theta = Math.atan2(n.z, n.x);
    const ridge = Math.sin(9 * theta + 4.2 * n.y);
    // 위아래 극점 쪽은 주름을 줄여서 꼬임이 모이게
    const fade = Math.sqrt(1 - n.y * n.y);
    v.copy(n).multiplyScalar(0.42 + 0.055 * ridge * fade);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const g = new Group();
  g.add(mesh(geo, clay(hex)));
  return g;
}

/** 모서리가 둥근 큐브 */
function roundedCube(size: number, radius: number) {
  const s = new Shape();
  const h = size / 2 - radius;
  s.moveTo(-h, -size / 2);
  s.lineTo(h, -size / 2);
  s.quadraticCurveTo(size / 2, -size / 2, size / 2, -h);
  s.lineTo(size / 2, h);
  s.quadraticCurveTo(size / 2, size / 2, h, size / 2);
  s.lineTo(-h, size / 2);
  s.quadraticCurveTo(-size / 2, size / 2, -size / 2, h);
  s.lineTo(-size / 2, -h);
  s.quadraticCurveTo(-size / 2, -size / 2, -h, -size / 2);
  const depth = size - radius * 2;
  const geo = new ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: radius,
    bevelSize: radius * 0.98,
    bevelSegments: 6,
    curveSegments: 12,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/** 면마다 동그란 돌기가 붙은 큐브 */
function knobCube(hex: string) {
  const g = new Group();
  const mat = clay(hex);
  const knobMat = clay(`#${tint(hex, 0.18).getHexString()}`);
  g.add(mesh(new RoundedBoxGeometry(0.6, 0.6, 0.6, 6, 0.13), mat));
  // 납작하고 끝이 둥근 돌기
  const knob = new CapsuleGeometry(0.13, 0.04, 8, 28);
  const dirs: [Vector3, [number, number, number]][] = [
    [new Vector3(1, 0, 0), [0, 0, Math.PI / 2]],
    [new Vector3(-1, 0, 0), [0, 0, Math.PI / 2]],
    [new Vector3(0, 1, 0), [0, 0, 0]],
    [new Vector3(0, -1, 0), [0, 0, 0]],
    [new Vector3(0, 0, 1), [Math.PI / 2, 0, 0]],
    [new Vector3(0, 0, -1), [Math.PI / 2, 0, 0]],
  ];
  dirs.forEach(([d, r]) => {
    const k = mesh(knob, knobMat);
    k.position.copy(d.multiplyScalar(0.3));
    k.rotation.set(...r);
    k.scale.set(1, 0.85, 1);
    g.add(k);
  });
  return g;
}

/** 끝이 볼록하게 마감된 입체 십자 */
function cross(hex: string) {
  const g = new Group();
  const mat = clay(hex);
  const arm = new CapsuleGeometry(0.17, 0.44, 8, 28);
  const a = mesh(arm, mat);
  const b = mesh(arm, mat);
  b.rotation.z = Math.PI / 2;
  const c = mesh(arm, mat);
  c.rotation.x = Math.PI / 2;
  g.add(a, b, c);
  // 팔 끝의 동그란 마개
  const cap = new CylinderGeometry(0.15, 0.15, 0.1, 32);
  [
    [0, 0.4, 0, 0, 0, 0],
    [0, -0.4, 0, 0, 0, 0],
    [0.4, 0, 0, 0, 0, Math.PI / 2],
    [-0.4, 0, 0, 0, 0, Math.PI / 2],
    [0, 0, 0.4, Math.PI / 2, 0, 0],
    [0, 0, -0.4, Math.PI / 2, 0, 0],
  ].forEach(([x, y, z, rx, ry, rz]) => {
    const m = mesh(cap, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    g.add(m);
  });
  return g;
}

/** 둥근 원통 네 개 묶음 */
function bundle(hex: string) {
  const g = new Group();
  const mat = clay(hex);
  const rod = new CapsuleGeometry(0.15, 0.42, 8, 28);
  [
    [-0.15, 0.06, -0.15],
    [0.15, -0.04, -0.15],
    [-0.15, -0.05, 0.15],
    [0.15, 0.08, 0.15],
  ].forEach(([x, y, z]) => {
    const r = mesh(rod, mat);
    r.position.set(x, y, z);
    g.add(r);
  });
  return g;
}

/** 보송한 링 세 개를 엇갈려 쌓은 탑 */
function fuzzRings(hex: string) {
  const g = new Group();
  const mat = velvet(hex);
  [
    [0.25, 0.11, -0.25, 0.0, 0.08],
    [0.24, 0.115, 0, -0.06, -0.1],
    [0.2, 0.105, 0.24, 0.05, 0.12],
  ].forEach(([r, tube, y, x, tilt]) => {
    const t = mesh(new TorusGeometry(r, tube, 28, 72), mat);
    t.rotation.x = Math.PI / 2 + tilt;
    t.position.set(x, y, 0);
    g.add(t);
  });
  return g;
}

/** 두께 있는 지그재그 리본 */
function zigzag(hex: string) {
  const pts: Vector2[] = [];
  const steps = 4,
    w = 0.95,
    amp = 0.13,
    thick = 0.07;
  // 위쪽 선을 따라가고, 아래쪽 선으로 돌아온다
  for (let i = 0; i <= steps * 2; i++)
    pts.push(new Vector2(-w / 2 + (w * i) / (steps * 2), i % 2 ? amp : -amp));
  const top = pts.map((p) => p.clone().add(new Vector2(0, thick)));
  const s = new Shape();
  s.moveTo(top[0].x, top[0].y);
  top.slice(1).forEach((p) => s.lineTo(p.x, p.y));
  [...pts].reverse().forEach((p) => s.lineTo(p.x, p.y));
  s.closePath();
  const geo = new ExtrudeGeometry(s, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 6,
    curveSegments: 12,
  });
  geo.translate(0, -thick / 2, -0.21);
  const g = new Group();
  g.add(mesh(geo, gloss(hex)));
  return g;
}

/** 가운데 구멍이 있는 반투명 도넛 + 안쪽 유광 링 */
function glassDonut(hex: string) {
  // 단면을 돌려서 만든 납작한 도넛
  const profile: Vector2[] = [];
  const inner = 0.1,
    outer = 0.44,
    half = 0.17;
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI;
    profile.push(
      new Vector2(
        (inner + outer) / 2 + Math.sin(t) * ((outer - inner) / 2),
        -Math.cos(t) * half,
      ),
    );
  }
  const g = new Group();
  const shell = mesh(new LatheGeometry(profile, 72), glass(hex));
  g.add(shell);
  const core = mesh(new TorusGeometry(0.16, 0.05, 20, 56), gloss(hex));
  core.rotation.x = Math.PI / 2;
  g.add(core);
  return g;
}

export function buildModel(def: ModelDef): Group {
  const make = {
    swirl,
    knobCube,
    cross,
    bundle,
    fuzzRings,
    zigzag,
    glassDonut,
  }[def.kind];
  const outer = new Group();
  const inner = make(def.color);
  outer.add(inner);
  return outer;
}

export function disposeModel(g: Group) {
  const seen = new Set<unknown>();
  g.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    if (!seen.has(m.geometry)) {
      seen.add(m.geometry);
      m.geometry.dispose();
    }
    const mat = m.material as MeshPhysicalMaterial;
    if (!seen.has(mat)) {
      seen.add(mat);
      mat.dispose();
    }
  });
}
