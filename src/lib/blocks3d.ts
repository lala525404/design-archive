import {
  DirectionalLight,
  Group,
  NeutralToneMapping,
  Object3D,
  PMREMGenerator,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ModelDef, buildModel, disposeModel } from "./models3d";

/*
 * 첫 화면의 3D 오브젝트.
 * - 쉴 때는 바닥선 위 정해진 자리에 3/4 각도로 앉아 있다
 * - 잡으면 앞으로 들려 올라와 손을 따라오고 기울어지며, 놓으면 스프링처럼 제자리로 돌아간다
 * - 오브젝트끼리 부딪히는 계산은 하지 않는다. 아무것도 움직이지 않으면 다시 그리지 않는다
 */

export interface BlockDef extends ModelDef {
  id: string;
  label: string;
}
interface Home {
  x: number; // px, 캔버스 왼쪽 기준 중심
  y: number; // px, 바닥선 기준 중심 (위가 +)
}
interface State {
  pos: Vector3;
  vel: Vector3;
  rot: Vector3;
  rotVel: Vector3;
}

export class Blocks3D {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(16, 1, 1, 100000);
  private objects: Group[] = [];
  private states: State[] = [];
  private homes: Home[] = [];
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
  private envTexture: Texture;
  private readySent = false;
  /** 등장 시작 시각 (느린 기기에서도 등장 순서가 밀리지 않게 실제 시간 기준) */
  private entranceStart = 0;
  /** 느린 프레임이 이어지면 해상도를 낮춘다 (저사양 노트북 대비) */
  private slowFrames = 0;
  private lowered = false;

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.toneMapping = NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    // 부드러운 스튜디오 반사
    const pmrem = new PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();
    const key = new DirectionalLight(0xffffff, 0.9);
    key.position.set(-0.6, 1, 0.8);
    this.scene.add(key);
    const fill = new DirectionalLight(0xdfe6ff, 0.4);
    fill.position.set(0.8, -0.2, 0.6);
    this.scene.add(fill);

    defs.forEach((def, i) => {
      const obj = buildModel(def);
      obj.userData.index = i;
      this.scene.add(obj);
      this.objects.push(obj);
      this.states.push({
        pos: new Vector3(),
        vel: new Vector3(),
        rot: new Vector3(...def.rest),
        rotVel: new Vector3(),
      });
      this.entrance.push(animateIn ? i * 80 : -1);
      this.entranceStart = 0;
    });

    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onCancel);
    canvas.addEventListener("pointerleave", this.onLeave);
    document.addEventListener("visibilitychange", this.wake);
  }

  /** 스테이지 크기에 맞춰 카메라와 자리를 다시 잡는다 */
  resize(width: number) {
    const { unit, homes, height } = this.layout(width);
    this.width = width;
    this.height = height;
    this.unit = unit;
    this.homes = homes;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // z=0 평면에서 1px = 1단위
    this.camera.position.set(0, 0, height / 2 / Math.tan((this.camera.fov * Math.PI) / 360));
    this.camera.far = this.camera.position.z * 3;
    this.camera.updateProjectionMatrix();
    this.objects.forEach((o, i) => {
      o.scale.setScalar(unit);
      const st = this.states[i];
      const home = this.homeWorld(i);
      if (this.entrance[i] >= 0) st.pos.set(home.x, home.y + unit * 1.1, 0);
      else st.pos.copy(home);
    });
    this.wake();
  }

  private homeWorld(i: number) {
    const h = this.homes[i];
    return new Vector3(h.x - this.width / 2, h.y - this.height / 2, 0);
  }
  private restRot(i: number) {
    return new Vector3(...this.defs[i].rest);
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
    const hit = this.raycaster.intersectObjects(this.objects, true)[0];
    if (!hit) return -1;
    let o: Object3D | null = hit.object;
    while (o && o.userData.index === undefined) o = o.parent;
    return o ? (o.userData.index as number) : -1;
  }
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
    const lift = this.unit * 0.9;
    if (d) {
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) {
        d.moved = true;
        this.dragging = d.index;
        const p = this.toPlane(e, lift);
        this.grabOffset.copy(this.states[d.index].pos).setZ(lift).sub(p);
        this.canvas.style.cursor = "grabbing";
        this.callbacks.onHover(null);
      }
      if (this.dragging >= 0) {
        this.dragTarget.copy(this.toPlane(e, lift)).add(this.grabOffset).setZ(lift);
        const now = performance.now();
        const dt = Math.max(8, now - this.lastPointer.t);
        this.pointerVel.set(
          (e.clientX - this.lastPointer.x) / dt,
          (e.clientY - this.lastPointer.y) / dt,
        );
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
    // 던진 방향으로 살짝 튕기며 제자리로, 빙글 돌면서
    const st = this.states[d.index];
    st.vel.x += this.pointerVel.x * 600;
    st.vel.y -= this.pointerVel.y * 600;
    st.rotVel.y += this.pointerVel.x * 6;
    st.rotVel.x += this.pointerVel.y * 6;
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
    const home = this.homes[this.hover];
    this.callbacks.onHover({
      label: this.defs[this.hover].label,
      x: home.x,
      y: home.y + this.unit * 0.5 + 12,
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
    const frameMs = now - this.last;
    const dt = Math.min(1 / 30, frameMs / 1000);
    if (!this.lowered) {
      this.slowFrames = frameMs > 26 ? this.slowFrames + 1 : 0;
      if (this.slowFrames > 12) {
        this.lowered = true;
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(this.width, this.height, false);
      }
    }
    this.last = now;
    let moving = false;

    this.states.forEach((st, i) => {
      const obj = this.objects[i];
      if (this.entrance[i] >= 0) {
        if (!this.entranceStart) this.entranceStart = now;
        if (now - this.entranceStart < this.entrance[i]) {
          obj.visible = false;
          moving = true;
          return;
        }
        this.entrance[i] = -1;
      }
      obj.visible = true;

      const target = this.homeWorld(i);
      const targetRot = this.restRot(i);
      let stiffness = 160,
        damping = 20;
      if (i === this.dragging) {
        target.copy(this.dragTarget);
        stiffness = 520;
        damping = 34;
        targetRot.x += Math.max(-0.7, Math.min(0.7, this.pointerVel.y * 1.1));
        targetRot.y += Math.max(-0.7, Math.min(0.7, this.pointerVel.x * 1.1));
        targetRot.z += Math.max(-0.4, Math.min(0.4, -this.pointerVel.x * 0.4));
        this.pointerVel.multiplyScalar(0.9);
      } else if (i === this.hover && this.dragging < 0) {
        target.y += 8;
        target.z += this.unit * 0.15;
        targetRot.y += 0.35;
      }

      const force = target
        .clone()
        .sub(st.pos)
        .multiplyScalar(stiffness)
        .sub(st.vel.clone().multiplyScalar(damping));
      st.vel.addScaledVector(force, dt);
      st.pos.addScaledVector(st.vel, dt);
      const rforce = targetRot
        .clone()
        .sub(st.rot)
        .multiplyScalar(stiffness * 0.7)
        .sub(st.rotVel.clone().multiplyScalar(damping * 0.75));
      st.rotVel.addScaledVector(rforce, dt);
      st.rot.addScaledVector(st.rotVel, dt);

      obj.position.copy(st.pos);
      obj.rotation.set(st.rot.x, st.rot.y, st.rot.z);

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

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onCancel);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
    document.removeEventListener("visibilitychange", this.wake);
    this.objects.forEach(disposeModel);
    this.envTexture.dispose();
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
