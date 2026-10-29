import Matter from "matter-js";

export type BlockKind =
  "rectangle" | "hexagon" | "clover" | "circle" | "palette";
export interface BlockSpec {
  id: string;
  kind: BlockKind;
  color?: string;
  label: string;
  delay: number;
  turn: number;
}
export const BLOCKS: BlockSpec[] = [
  {
    id: "course-list",
    kind: "rectangle",
    color: "#B7E1D1",
    label: "상세페이지 작업 찾기",
    delay: 0,
    turn: -3,
  },
  {
    id: "course-recent",
    kind: "hexagon",
    color: "#A9D3FF",
    label: "최근 과정 작업 보기",
    delay: 780,
    turn: 6,
  },
  {
    id: "banner-list",
    kind: "rectangle",
    color: "#FFB5B8",
    label: "홍보 배너 찾기",
    delay: 150,
    turn: 3,
  },
  {
    id: "banner-recent",
    kind: "hexagon",
    color: "#246BFD",
    label: "최근 홍보 디자인 보기",
    delay: 1050,
    turn: -7,
  },
  {
    id: "license",
    kind: "clover",
    color: "#FFE59A",
    label: "산돌 라이선스 확인",
    delay: 310,
    turn: -8,
  },
  {
    id: "cards",
    kind: "circle",
    color: "#246BFD",
    label: "최근 카드뉴스 보기",
    delay: 470,
    turn: 5,
  },
  {
    id: "palette",
    kind: "palette",
    label: "색채학 컬러 레퍼런스 찾기",
    delay: 630,
    turn: -5,
  },
];

export interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function blockLayout(width: number, height: number): Placement[] {
  const floor = Math.max(24, height - 8);
  const size = Math.max(8, Math.min(width * 0.17, (floor - 20) / 2, 164));
  const clusterGap = Math.min(14, Math.max(5, width * 0.01));
  const space = Math.max(3, (width - (5.22 * size + clusterGap)) / 3);
  const cluster = 2 * size + clusterGap;
  const cloverX = cluster + space + size * 0.58;
  const circleX = cluster + 2 * space + size * 1.16 + size * 0.67;
  const paletteX = width - size * 0.36;
  return [
    { x: size * 0.5, y: floor - size * 0.5, width: size, height: size },
    { x: size * 0.5, y: floor - size * 1.5, width: size, height: size },
    {
      x: size * 1.5 + clusterGap,
      y: floor - size * 0.5,
      width: size,
      height: size,
    },
    {
      x: size * 1.5 + clusterGap,
      y: floor - size * 1.5,
      width: size,
      height: size,
    },
    {
      x: cloverX,
      y: floor - size * 0.58,
      width: size * 1.16,
      height: size * 1.16,
    },
    {
      x: circleX,
      y: floor - size * 0.67,
      width: size * 1.34,
      height: size * 1.34,
    },
    {
      x: paletteX,
      y: floor - size * 0.56,
      width: size * 0.72,
      height: size * 1.12,
    },
  ];
}

export interface PhysicalBlock {
  spec: BlockSpec;
  body: Matter.Body;
  placement: Placement;
  spawned: boolean;
}

// This engine has no renderer or event listeners; React owns accessible DOM buttons.
export class BlockWorld {
  readonly engine: Matter.Engine;
  readonly blocks: PhysicalBlock[];
  readonly floor: number;
  elapsed = 0;
  dragging: number | null = null;
  private spring: Matter.Constraint | null = null;

  constructor(
    readonly width: number,
    readonly height: number,
    readonly reducedMotion = false,
  ) {
    this.floor = Math.max(24, height - 8);
    this.engine = Matter.Engine.create({
      enableSleeping: true,
      positionIterations: 8,
      velocityIterations: 6,
      constraintIterations: 4,
    });
    this.engine.gravity.y = 1.15;
    const wallOptions = { isStatic: true, friction: 0.75, restitution: 0.12 };
    Matter.Composite.add(this.engine.world, [
      Matter.Bodies.rectangle(
        width / 2,
        this.floor + 60,
        width + 240,
        120,
        wallOptions,
      ),
      Matter.Bodies.rectangle(
        -60,
        height / 2 - 500,
        120,
        height + 2000,
        wallOptions,
      ),
      Matter.Bodies.rectangle(
        width + 60,
        height / 2 - 500,
        120,
        height + 2000,
        wallOptions,
      ),
    ]);
    const placements = blockLayout(width, height);
    this.blocks = BLOCKS.map((spec, index) => {
      const placement = placements[index];
      const { x, y, width: w, height: h } = placement;
      const options = {
        friction: 0.62,
        frictionStatic: 0.9,
        frictionAir: 0.025,
        restitution: 0.27,
        sleepThreshold: 45,
        label: spec.id,
      };
      let body: Matter.Body;
      if (spec.kind === "circle") {
        body = Matter.Bodies.circle(x, y, w / 2, options, 32);
      } else if (spec.kind === "hexagon") {
        const points = [
          [-0.25, -0.5],
          [0.25, -0.5],
          [0.5, 0],
          [0.25, 0.5],
          [-0.25, 0.5],
          [-0.5, 0],
        ].map(([px, py]) => ({ x: x + px * w, y: y + py * h }));
        body = Matter.Body.create({
          ...options,
          position: { x, y },
          vertices: points,
        });
      } else if (spec.kind === "clover") {
        const parts = [
          [-0.2, -0.2],
          [0.2, -0.2],
          [0.2, 0.2],
          [-0.2, 0.2],
        ].map(([px, py]) =>
          Matter.Bodies.circle(x + px * w, y + py * h, w * 0.3, options, 20),
        );
        body = Matter.Body.create({ ...options, parts });
      } else {
        body = Matter.Bodies.rectangle(x, y, w, h, {
          ...options,
          chamfer: { radius: Math.min(w, h) * 0.12 },
        });
      }
      if (reducedMotion) {
        Matter.Body.setStatic(body, true);
        Matter.Composite.add(this.engine.world, body);
      } else {
        Matter.Body.setPosition(body, { x, y: -h * 0.8 });
        Matter.Body.setAngle(body, (spec.turn * Math.PI) / 180);
      }
      return { spec, body, placement, spawned: reducedMotion };
    });
  }

  step(delta = 1000 / 60) {
    this.elapsed += delta;
    for (const block of this.blocks) {
      if (!block.spawned && this.elapsed >= block.spec.delay) {
        Matter.Composite.add(this.engine.world, block.body);
        block.spawned = true;
        Matter.Body.setVelocity(block.body, { x: 0, y: 1 });
      }
    }
    if (this.reducedMotion) return;
    Matter.Engine.update(this.engine, Math.min(delta, 1000 / 60));
    for (const block of this.blocks) {
      if (!block.spawned) continue;
      const body = block.body;
      // Contain energetic throws and recover if a tab was throttled mid-frame.
      const shiftX =
        body.bounds.min.x < -2
          ? -body.bounds.min.x
          : body.bounds.max.x > this.width + 2
            ? this.width - body.bounds.max.x
            : 0;
      const shiftY =
        body.bounds.max.y > this.floor + 2
          ? this.floor - body.bounds.max.y
          : this.elapsed > block.spec.delay + 1200 && body.bounds.max.y < 0
            ? -body.bounds.min.y + 2
            : 0;
      if (shiftX || shiftY) {
        Matter.Body.translate(body, { x: shiftX, y: shiftY });
        Matter.Body.setVelocity(body, {
          x: shiftX ? -body.velocity.x * 0.2 : body.velocity.x,
          y: shiftY ? 0 : body.velocity.y,
        });
      }
    }
  }

  beginDrag(index: number, point: Matter.Vector) {
    this.endDrag();
    const block = this.blocks[index];
    if (!block?.spawned) return false;
    this.dragging = index;
    Matter.Sleeping.set(block.body, false);
    if (!this.reducedMotion) {
      this.spring = Matter.Constraint.create({
        pointA: this.clamp(point, block.placement),
        bodyB: block.body,
        pointB: { x: 0, y: 0 },
        length: 0,
        stiffness: 0.2,
        damping: 0.15,
      });
      Matter.Composite.add(this.engine.world, this.spring);
    }
    this.moveDrag(point);
    return true;
  }

  moveDrag(point: Matter.Vector) {
    if (this.dragging === null) return;
    const block = this.blocks[this.dragging];
    const target = this.clamp(point, block.placement);
    if (this.reducedMotion) Matter.Body.setPosition(block.body, target);
    else if (this.spring) this.spring.pointA = target;
    Matter.Sleeping.set(block.body, false);
  }

  endDrag() {
    if (this.spring) Matter.Composite.remove(this.engine.world, this.spring);
    if (this.dragging !== null) {
      const body = this.blocks[this.dragging].body;
      const speed = Matter.Vector.magnitude(body.velocity);
      if (speed > 18)
        Matter.Body.setVelocity(
          body,
          Matter.Vector.mult(body.velocity, 18 / speed),
        );
    }
    this.spring = null;
    this.dragging = null;
  }

  nudge(point: Matter.Vector, velocity: Matter.Vector) {
    if (
      this.reducedMotion ||
      this.dragging !== null ||
      Matter.Vector.magnitude(velocity) < 1
    )
      return;
    for (const block of this.blocks) {
      if (!block.spawned || block.body.isStatic) continue;
      const offset = Matter.Vector.sub(block.body.position, point);
      const distance = Matter.Vector.magnitude(offset);
      const reach =
        Math.max(block.placement.width, block.placement.height) * 0.65 + 24;
      if (distance > reach) continue;
      const strength =
        Math.min(1, Matter.Vector.magnitude(velocity) / 15) *
        (1 - distance / reach);
      const direction = Matter.Vector.normalise(
        distance > 1 ? offset : velocity,
      );
      Matter.Sleeping.set(block.body, false);
      Matter.Body.applyForce(
        block.body,
        point,
        Matter.Vector.mult(direction, block.body.mass * 0.0007 * strength),
      );
    }
  }

  get needsFrame() {
    return (
      this.dragging !== null ||
      this.blocks.some(
        (block) =>
          !block.spawned || (!block.body.isSleeping && !block.body.isStatic),
      )
    );
  }

  dispose() {
    this.endDrag();
    Matter.Composite.clear(this.engine.world, false);
    Matter.Engine.clear(this.engine);
  }

  private clamp(point: Matter.Vector, placement: Placement) {
    return {
      x: Math.max(
        placement.width / 2 + 2,
        Math.min(this.width - placement.width / 2 - 2, point.x),
      ),
      y: Math.max(
        placement.height / 2 + 2,
        Math.min(this.floor - placement.height / 2 - 2, point.y),
      ),
    };
  }
}
