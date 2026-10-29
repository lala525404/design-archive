import {
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Shape,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

/*
 * 첫 화면의 입체 블록.
 * - 쉴 때는 바닥선 위 고정 자리에 반듯하게 서 있다 (2D 배치와 같은 좌표)
 * - 잡으면 앞으로 들려 올라와 손을 따라오고, 놓으면 스프링처럼 제자리로 돌아간다
 * - 블록끼리 부딪히는 계산은 하지 않는다. 아무것도 움직이지 않으면 다시 그리지 않는다
 */

export type BlockKind = "hexagon" | "square" | "clover" | "circle";
export interface BlockDef {
  id: string;
  kind: BlockKind;
  color: string;
  label: string;
}
interface Home {
  x: number; // px, 스테이지 왼쪽 기준 중심
  y: number; // px, 바닥선 기준 중심 (위가 +)
}

// ── 도형 (한 변 1 기준, 중심이 원점) ──────────────────────────
function roundedPolygon(points: [number, number][], radius: number) {
  const s = new Shape();
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = new Vector2(...points[i]);
    const prev = new Vector2(...points[(i - 1 + n) % n]);
    const next = new Vector2(...points[(i + 1) % n]);
    const a = p.clone().add(prev.clone().sub(p).setLength(radius));
    const b = p.clone().add(next.clone().sub(p).setLength(radius));
    if (i === 0) s.moveTo(a.x, a.y);
    else s.lineTo(a.x, a.y);
    s.quadraticCurveTo(p.x, p.y, b.x, b.y);
  }
  s.closePath();
  return s;
}

function shapeFor(kind: BlockKind): { shape: Shape; height: number } {
  if (kind === "hexagon") {
    // 위아래가 평평한 육각형, 높이 0.88
    const h = 0.44;
    return {
      shape: roundedPolygon(
        [
          [-0.25, h],
          [0.25, h],
          [0.5, 0],
          [0.25, -h],
          [-0.25, -h],
          [-0.5, 0],
        ],
        0.07,
      ),
      height: 0.88,
    };
  }
  if (kind === "square") {
    return {
      shape: roundedPolygon(
        [
          [-0.5, 0.5],
          [0.5, 0.5],
          [0.5, -0.5],
          [-0.5, -0.5],
        ],
        0.16,
      ),
      height: 1,
    };
  }
  if (kind === "circle") {
    const s = new Shape();
    s.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
    return { shape: s, height: 1 };
  }
  // 클로버: 원 네 개의 바깥 윤곽
  const r = 0.27,
    a = 0.23,
    gap = Math.sqrt(r * r - a * a);
  const centers = [
    new Vector2(a, a),
    new Vector2(a, -a),
    new Vector2(-a, -a),
    new Vector2(-a, a),
  ];
  const meet = (i: number, j: number) => {
    const m = centers[i].clone().add(centers[j]).multiplyScalar(0.5);
    return m.clone().add(m.clone().normalize().multiplyScalar(gap));
  };
  const s = new Shape();
  centers.forEach((c, i) => {
    const from = meet((i + 3) % 4, i).sub(c);
    const to = meet(i, (i + 1) % 4).sub(c);
    s.absarc(c.x, c.y, r, Math.atan2(from.y, from.x), Math.atan2(to.y, to.x), true);
  });
  return { shape: s, height: 1 };
}

const DEPTH = 0.2;

// ── 스프링 ───────────────────────────────────────────────
interface State {
  pos: Vector3;
  vel: Vector3;
  rot: Vector3;
  rotVel: Vector3;
}

export class Blocks3D {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(13, 1, 1, 100000);
  private meshes: Mesh[] = [];
  private states: State[] = [];
  private homes: Home[] = [];
  private heights: number[] = [];
  private width = 0;
  private height = 0;
  private unit = 100;
  private raf = 0;
  private last = 0;
  private dragging = -1;
  private hover = -1;
  private dragTarget = new Vector3();
  private grabOffset = new Vector3();
  private lastPointer = { x: 0, y: 0, t: 0 };
  private pointerVel = new Vector2();
  private down: { x: number; y: number; index: number; moved: boolean } | null = null;
  private raycaster = new Raycaster();
  private disposed = false;
  private entrance: number[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private defs: BlockDef[],
    private layout: (width: number) => { unit: number; homes: Home[]; height: number },
    private callbacks: {
      onActivate: (id: string) => void;
      onHover: (info: { label: string; x: number; y: number } | null) => void;
      onReady: () => void;
    },
    animateIn: boolean,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene.add(new HemisphereLight(0xffffff, 0xd9d2ca, 1.9));
    const key = new DirectionalLight(0xffffff, 1.5);
    key.position.set(-0.6, 1, 1.2);
    this.scene.add(key);
    const rim = new DirectionalLight(0xffffff, 0.35);
    rim.position.set(1, -0.3, 0.6);
    this.scene.add(rim);

    defs.forEach((def, i) => {
      const { shape, height } = shapeFor(def.kind);
      const geo = new ExtrudeGeometry(shape, {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.04,
        bevelSegments: 4,
        curveSegments: 40,
      });
      // 앞면이 z=0에 오게 → 쉴 때 2D 배치와 크기가 정확히 같다
      geo.translate(0, 0, -DEPTH - 0.05);
      const mat = new MeshStandardMaterial({
        color: new Color(def.color),
        roughness: 0.78,
        metalness: 0,
      });
      const mesh = new Mesh(geo, mat);
      mesh.userData.index = i;
      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.heights.push(height);
      this.states.push({
        pos: new Vector3(),
        vel: new Vector3(),
        rot: new Vector3(),
        rotVel: new Vector3(),
      });
      this.entrance.push(animateIn ? i * 70 : -1);
    });

    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onCancel);
    canvas.addEventListener("pointerleave", this.onLeave);
    document.addEventListener("visibilitychange", this.wake);
  }

  /** 스테이지 크기에 맞춰 카메라와 블록 자리를 다시 잡는다 */
  resize(width: number) {
    const { unit, homes, height } = this.layout(width);
    this.width = width;
    this.height = height;
    this.unit = unit;
    this.homes = homes;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // z=0 평면에서 1px = 1단위가 되도록 거리 계산
    this.camera.position.set(0, 0, height / 2 / Math.tan((this.camera.fov * Math.PI) / 360));
    this.camera.near = 1;
    this.camera.far = this.camera.position.z * 3;
    this.camera.updateProjectionMatrix();
    this.meshes.forEach((m, i) => {
      m.scale.setScalar(unit);
      const home = this.homeWorld(i);
      const st = this.states[i];
      if (this.entrance[i] >= 0) {
        st.pos.set(home.x, home.y + unit * 0.9, 0);
      } else st.pos.copy(home);
    });
    this.wake();
  }

  private homeWorld(i: number) {
    const h = this.homes[i];
    return new Vector3(h.x - this.width / 2, h.y - this.height / 2, 0);
  }

  // ── 포인터 ──────────────────────────────────────────
  private ndc(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return new Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
  }
  private pick(e: PointerEvent) {
    this.raycaster.setFromCamera(this.ndc(e), this.camera);
    const hit = this.raycaster.intersectObjects(this.meshes, false)[0];
    return hit ? (hit.object.userData.index as number) : -1;
  }
  /** 화면 좌표를 z 깊이 평면 위의 점으로 */
  private toPlane(e: PointerEvent, z: number) {
    this.raycaster.setFromCamera(this.ndc(e), this.camera);
    const p = new Vector3();
    this.raycaster.ray.intersectPlane(new Plane(new Vector3(0, 0, 1), -z), p);
    return p;
  }

  private onDown = (e: PointerEvent) => {
    if (e.button !== 0 || this.down) return;
    const index = this.pick(e);
    if (index < 0) return;
    this.down = { x: e.clientX, y: e.clientY, index, moved: false };
    this.canvas.setPointerCapture(e.pointerId);
    this.lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  private onMove = (e: PointerEvent) => {
    const d = this.down;
    if (d) {
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) {
        d.moved = true;
        this.dragging = d.index;
        const lift = this.unit * 0.9;
        const p = this.toPlane(e, lift);
        this.grabOffset.copy(this.states[d.index].pos).setZ(lift).sub(p);
        this.canvas.style.cursor = "grabbing";
        this.callbacks.onHover(null);
      }
      if (this.dragging >= 0) {
        const lift = this.unit * 0.9;
        this.dragTarget.copy(this.toPlane(e, lift)).add(this.grabOffset).setZ(lift);
        const now = performance.now();
        const dt = Math.max(8, now - this.lastPointer.t);
        this.pointerVel.set((e.clientX - this.lastPointer.x) / dt, (e.clientY - this.lastPointer.y) / dt);
        this.lastPointer = { x: e.clientX, y: e.clientY, t: now };
        this.wake();
      }
      return;
    }
    const index = this.pick(e);
    if (index !== this.hover) {
      this.hover = index;
      this.canvas.style.cursor = index >= 0 ? "grab" : "";
      this.emitHover();
      this.wake();
    }
  };

  private onUp = (e: PointerEvent) => {
    const d = this.down;
    this.down = null;
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    if (!d) return;
    if (!d.moved) {
      this.callbacks.onActivate(this.defs[d.index].id);
      return;
    }
    // 던진 방향으로 살짝 튕기며 제자리로
    const st = this.states[d.index];
    st.vel.x += this.pointerVel.x * 600;
    st.vel.y -= this.pointerVel.y * 600;
    st.rotVel.z -= this.pointerVel.x * 0.6;
    this.dragging = -1;
    this.canvas.style.cursor = this.pick(e) >= 0 ? "grab" : "";
    this.wake();
  };

  private onCancel = () => {
    this.down = null;
    this.dragging = -1;
    this.wake();
  };

  private onLeave = () => {
    if (this.down) return;
    this.hover = -1;
    this.canvas.style.cursor = "";
    this.callbacks.onHover(null);
    this.wake();
  };

  private emitHover() {
    if (this.hover < 0) return this.callbacks.onHover(null);
    const i = this.hover;
    const home = this.homes[i];
    this.callbacks.onHover({
      label: this.defs[i].label,
      x: home.x,
      // 바닥선에서 블록 윗면 위까지 거리 (px)
      y: home.y + (this.heights[i] * this.unit) / 2 + 10,
    });
  }

  // ── 애니메이션 ───────────────────────────────────────
  private wake = () => {
    if (this.disposed || this.raf || document.hidden) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  };

  private tick = (now: number) => {
    this.raf = 0;
    const dt = Math.min(1 / 30, (now - this.last) / 1000);
    this.last = now;
    let moving = false;

    this.states.forEach((st, i) => {
      const mesh = this.meshes[i];
      const home = this.homeWorld(i);
      // 등장: 순서대로 위에서 내려와 앉는다
      if (this.entrance[i] >= 0) {
        this.entrance[i] -= dt * 1000;
        if (this.entrance[i] > 0) {
          mesh.visible = false;
          moving = true;
          return;
        }
        this.entrance[i] = -1;
      }
      mesh.visible = true;

      const target = new Vector3();
      const targetRot = new Vector3();
      let stiffness = 170,
        damping = 24;
      if (i === this.dragging) {
        target.copy(this.dragTarget);
        stiffness = 520;
        damping = 34;
        // 움직이는 방향으로 기울어진다
        targetRot.set(
          Math.max(-0.6, Math.min(0.6, this.pointerVel.y * 0.9)),
          Math.max(-0.6, Math.min(0.6, this.pointerVel.x * 0.9)),
          Math.max(-0.4, Math.min(0.4, -this.pointerVel.x * 0.35)),
        );
        this.pointerVel.multiplyScalar(0.9);
      } else {
        target.copy(home);
        if (i === this.hover && this.dragging < 0) {
          target.y += 6;
          target.z += this.unit * 0.12;
          targetRot.set(-0.12, 0.18, 0);
        }
      }

      // 위치 스프링
      const force = target.clone().sub(st.pos).multiplyScalar(stiffness).sub(st.vel.clone().multiplyScalar(damping));
      st.vel.addScaledVector(force, dt);
      st.pos.addScaledVector(st.vel, dt);
      // 회전 스프링
      const rforce = targetRot.clone().sub(st.rot).multiplyScalar(stiffness * 0.8).sub(st.rotVel.clone().multiplyScalar(damping * 0.8));
      st.rotVel.addScaledVector(rforce, dt);
      st.rot.addScaledVector(st.rotVel, dt);

      mesh.position.copy(st.pos);
      mesh.rotation.set(st.rot.x, st.rot.y, st.rot.z);
      // 잡은 블록이 다른 블록 앞에 그려지게
      mesh.renderOrder = i === this.dragging ? 1 : 0;

      const still =
        st.pos.distanceTo(target) < 0.3 &&
        st.vel.length() < 0.5 &&
        st.rot.distanceTo(targetRot) < 0.002 &&
        st.rotVel.length() < 0.01;
      if (still) {
        st.pos.copy(target);
        st.vel.set(0, 0, 0);
        st.rot.copy(targetRot);
        st.rotVel.set(0, 0, 0);
      } else moving = true;
    });

    this.renderer.render(this.scene, this.camera);
    if (!this.readySent) {
      this.readySent = true;
      this.callbacks.onReady();
    }
    if (moving || this.dragging >= 0) this.wake();
  };
  private readySent = false;

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onCancel);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
    document.removeEventListener("visibilitychange", this.wake);
    this.meshes.forEach((m) => {
      m.geometry.dispose();
      (m.material as MeshStandardMaterial).dispose();
    });
    this.renderer.dispose();
  }
}

/** WebGL을 쓸 수 있는지 */
export function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
