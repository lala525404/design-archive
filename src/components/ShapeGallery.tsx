import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, MoveUpRight } from "lucide-react";
import { DesignAsset } from "../types";
import { BLOCKS, BlockWorld } from "../lib/blockPhysics";

interface Props {
  assets: DesignAsset[];
  onSelectAsset: (id: string) => void;
  onNavigateToSearch: (q: string) => void;
  onNavigateToLicense: () => void;
}
interface Interaction {
  reset: () => void;
  begin: (index: number, x: number, y: number) => boolean;
  move: (x: number, y: number) => void;
  end: () => void;
  nudge: (x: number, y: number) => void;
}

export function ShapeGallery({
  assets,
  onSelectAsset,
  onNavigateToSearch,
  onNavigateToLicense,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const interaction = useRef<Interaction | null>(null);
  const press = useRef<{
    index: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef({ index: -1, until: 0 });
  const [grabbed, setGrabbed] = useState<string | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let world: BlockWorld | null = null;
    let frame = 0,
      lastTime = 0,
      accumulator = 0;
    let lastPointer: { x: number; y: number; time: number } | null = null;
    let rect = stage.getBoundingClientRect();

    const paint = () => {
      world?.blocks.forEach((block, index) => {
        const element = buttonRefs.current[index];
        if (!element) return;
        const { body, placement, spawned } = block;
        element.style.width = `${placement.width}px`;
        element.style.height = `${placement.height}px`;
        element.style.setProperty(
          "--chip-padding",
          `${Math.max(2, placement.width * 0.055)}px`,
        );
        element.style.transform = `translate3d(${(body.position.x - placement.width / 2).toFixed(2)}px,${(body.position.y - placement.height / 2).toFixed(2)}px,0) rotate(${body.angle.toFixed(4)}rad)`;
        element.dataset.spawned = String(spawned);
      });
    };
    const tick = (now: number) => {
      frame = 0;
      if (!world || document.hidden) return;
      accumulator += Math.min(50, lastTime ? now - lastTime : 1000 / 60);
      lastTime = now;
      while (accumulator >= 1000 / 60) {
        world.step();
        accumulator -= 1000 / 60;
      }
      paint();
      if (world.needsFrame) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    };
    const wake = () => {
      if (!frame && !document.hidden) {
        lastTime = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      accumulator = 0;
      lastPointer = null;
      world?.dispose();
      rect = stage.getBoundingClientRect();
      world = new BlockWorld(
        Math.max(1, rect.width),
        Math.max(1, rect.height),
        motionPreference.matches,
      );
      press.current = null;
      setGrabbed(null);
      paint();
      wake();
    };
    const point = (x: number, y: number) => ({
      x: x - rect.left,
      y: y - rect.top,
    });
    interaction.current = {
      reset,
      begin(index, x, y) {
        rect = stage.getBoundingClientRect();
        const started = world?.beginDrag(index, point(x, y)) ?? false;
        wake();
        return started;
      },
      move(x, y) {
        world?.moveDrag(point(x, y));
        paint();
        wake();
      },
      end() {
        world?.endDrag();
        lastPointer = null;
        wake();
      },
      nudge(x, y) {
        const now = performance.now(),
          p = point(x, y);
        if (lastPointer && now - lastPointer.time > 25) {
          const dt = Math.max(16, now - lastPointer.time);
          world?.nudge(p, {
            x: ((p.x - lastPointer.x) / dt) * 16,
            y: ((p.y - lastPointer.y) / dt) * 16,
          });
          lastPointer = { ...p, time: now };
          wake();
        } else if (!lastPointer) lastPointer = { ...p, time: now };
      },
    };
    reset();
    let width = rect.width,
      height = rect.height;
    const observer = new ResizeObserver((entries) => {
      const size = entries[0].contentRect;
      if (
        Math.abs(size.width - width) > 1 ||
        Math.abs(size.height - height) > 1
      ) {
        width = size.width;
        height = size.height;
        reset();
      }
    });
    observer.observe(stage);
    const visibility = () => {
      if (document.hidden) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        interaction.current?.end();
        press.current = null;
        setGrabbed(null);
      } else {
        rect = stage.getBoundingClientRect();
        wake();
      }
    };
    const resize = () => {
      rect = stage.getBoundingClientRect();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", resize);
    motionPreference.addEventListener("change", reset);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      world?.dispose();
      interaction.current = null;
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", resize);
      motionPreference.removeEventListener("change", reset);
    };
  }, []);

  const openRecent = (type: string) => {
    const asset = assets
      .filter((a) => a.type === type)
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))[0];
    if (asset) onSelectAsset(asset.id);
    else onNavigateToSearch(type);
  };
  const activate = (id: string) => {
    if (id === "course-list") onNavigateToSearch("상세페이지");
    if (id === "course-recent") openRecent("상세페이지");
    if (id === "banner-list") onNavigateToSearch("배너");
    if (id === "banner-recent") openRecent("배너");
    if (id === "license") onNavigateToLicense();
    if (id === "cards") openRecent("카드뉴스");
    if (id === "palette") onNavigateToSearch("색채학");
  };
  return (
    <section
      className={`shape-gallery interactive-gallery ${grabbed ? "is-grabbing" : ""}`}
      aria-label="움직이는 디자인 블록"
    >
      <div className="physics-toolbar">
        <span id="block-instructions">블록을 드래그해보세요.</span>
        <button
          className="physics-reset"
          onClick={() => interaction.current?.reset()}
          aria-label="블록 다시 쌓기"
        >
          <RotateCcw size={13} />
          <span>다시 쌓기</span>
        </button>
      </div>
      <div
        ref={stageRef}
        className="physics-stage"
        onPointerMove={(e) => {
          if (!press.current && e.pointerType === "mouse")
            interaction.current?.nudge(e.clientX, e.clientY);
        }}
      >
        {BLOCKS.map((spec, index) => (
          <button
            key={spec.id}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            className={`physics-block physics-block--${spec.kind} ${grabbed === spec.id ? "is-held" : ""}`}
            style={{ backgroundColor: spec.color }}
            data-spawned="false"
            aria-label={spec.label}
            aria-describedby="block-instructions"
            onPointerDown={(e) => {
              if (
                press.current ||
                e.isPrimary === false ||
                e.button !== 0 ||
                !interaction.current?.begin(index, e.clientX, e.clientY)
              )
                return;
              e.currentTarget.setPointerCapture(e.pointerId);
              press.current = {
                index,
                x: e.clientX,
                y: e.clientY,
                moved: false,
              };
              setGrabbed(spec.id);
            }}
            onPointerMove={(e) => {
              const p = press.current;
              if (!p || p.index !== index) return;
              if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 7)
                p.moved = true;
              interaction.current?.move(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              const p = press.current;
              if (!p || p.index !== index) return;
              if (p.moved)
                suppressClick.current = {
                  index,
                  until: performance.now() + 400,
                };
              interaction.current?.end();
              press.current = null;
              setGrabbed(null);
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              suppressClick.current = { index, until: performance.now() + 400 };
              interaction.current?.end();
              press.current = null;
              setGrabbed(null);
            }}
            onLostPointerCapture={() => {
              if (press.current?.index === index) {
                interaction.current?.end();
                press.current = null;
                setGrabbed(null);
              }
            }}
            onClick={(e) => {
              if (press.current) return;
              if (
                e.detail !== 0 &&
                suppressClick.current.index === index &&
                performance.now() < suppressClick.current.until
              )
                return;
              activate(spec.id);
            }}
          >
            {spec.kind === "palette" &&
              ["#A9D3FF", "#B7E1D1", "#FFE59A", "#FFB5B8"].map((color) => (
                <i
                  key={color}
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
              ))}
            <span className="block-open-cue" aria-hidden="true">
              <MoveUpRight size={18} />
            </span>
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {grabbed ? "블록을 움직이는 중입니다. 놓으면 다시 쌓입니다." : ""}
      </p>
    </section>
  );
}
