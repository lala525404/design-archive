import React from "react";
import { DesignAsset } from "../types";

interface Props {
  assets: DesignAsset[];
  onSelectAsset: (id: string) => void;
  onNavigateToSearch: (q: string) => void;
  onNavigateToLicense: () => void;
}

type Kind = "hexagon" | "square" | "clover" | "circle";
interface Block {
  id: string;
  kind: Kind;
  color: string;
  label: string;
}

// 바닥선 위에 반듯하게 쌓인 블록. 위치는 고정이고, 처음 들어올 때 한 번만 내려앉는다.
const COLUMNS: Block[][] = [
  [
    { id: "course-recent", kind: "hexagon", color: "#7FE495", label: "최근 과정 작업" },
    { id: "course-list", kind: "square", color: "#7FE495", label: "상세페이지" },
  ],
  [
    { id: "banner-recent", kind: "hexagon", color: "#F28C5A", label: "홍보 디자인" },
    { id: "banner-list", kind: "square", color: "#F5BFF0", label: "배너" },
  ],
];
const ROW: Block[] = [
  { id: "license", kind: "clover", color: "#F5CC55", label: "라이선스 확인" },
  { id: "cards", kind: "circle", color: "#6E9BF7", label: "카드뉴스" },
  { id: "palette", kind: "circle", color: "#6E9BF7", label: "컬러 레퍼런스" },
];

function Shape({ kind, color }: { kind: Kind; color: string }) {
  if (kind === "hexagon")
    return (
      <svg viewBox="0 0 100 88" aria-hidden="true">
        <polygon
          points="28,6 72,6 94,44 72,82 28,82 6,44"
          fill={color}
          stroke={color}
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (kind === "square")
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="16" fill={color} />
      </svg>
    );
  if (kind === "clover")
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <g fill={color}>
          <circle cx="27" cy="27" r="27" />
          <circle cx="73" cy="27" r="27" />
          <circle cx="27" cy="73" r="27" />
          <circle cx="73" cy="73" r="27" />
          <rect x="22" y="22" width="56" height="56" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill={color} />
    </svg>
  );
}

export function ShapeGallery({
  assets,
  onSelectAsset,
  onNavigateToSearch,
  onNavigateToLicense,
}: Props) {
  const openRecent = (type: string) => {
    const asset = assets
      .filter((a) => a.type === type)
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))[0];
    if (asset) onSelectAsset(asset.id);
    else onNavigateToSearch(type);
  };
  const activate = (id: string) => {
    if (id === "course-recent") openRecent("상세페이지");
    if (id === "course-list") onNavigateToSearch("상세페이지");
    if (id === "banner-recent") openRecent("배너");
    if (id === "banner-list") onNavigateToSearch("배너");
    if (id === "license") onNavigateToLicense();
    if (id === "cards") openRecent("카드뉴스");
    if (id === "palette") onNavigateToSearch("색채학");
  };

  let order = 0;
  const render = (block: Block) => {
    const delay = order++ * 70;
    return (
      <button
        key={block.id}
        type="button"
        className={`shape-block shape-block--${block.kind}`}
        style={{ animationDelay: `${delay}ms` }}
        onClick={() => activate(block.id)}
        aria-label={block.label}
      >
        <Shape kind={block.kind} color={block.color} />
        <span className="shape-label">{block.label}</span>
      </button>
    );
  };

  // 아래에서 위로 쌓이는 순서로 애니메이션 순번을 매긴다.
  const columns = COLUMNS.map((col) => [...col].reverse());
  return (
    <section className="shape-gallery" aria-label="디자인 자산 바로가기">
      <div className="shape-stage">
        <div className="shape-group shape-group--stacks">
          {columns.map((col, i) => (
            <div className="shape-stack" key={i}>
              {col.map(render).reverse()}
            </div>
          ))}
        </div>
        <div className="shape-group shape-group--row">{ROW.map(render)}</div>
      </div>
    </section>
  );
}
